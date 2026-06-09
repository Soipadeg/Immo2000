# backend/src/services/alerting_service.py

import os
import json
from datetime import datetime
from typing import Dict, Optional
import requests
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from enum import Enum

class AlertSeverity(Enum):
    INFO = 'info'
    WARNING = 'warning'
    CRITICAL = 'critical'

class AlertService:
    def __init__(self):
        self.slack_token = os.getenv('SLACK_TOKEN')
        self.slack_alerts_channel = os.getenv('SLACK_ALERTS_CHANNEL', '#alerts')
        self.pagerduty_key = os.getenv('PAGERDUTY_KEY')

        if self.slack_token:
            self.slack_client = WebClient(token=self.slack_token)
        else:
            self.slack_client = None

    def send_slack_alert(
        self,
        title: str,
        message: str,
        severity: AlertSeverity = AlertSeverity.INFO,
        context: Optional[Dict] = None
    ) -> bool:
        """Send alert to Slack"""
        if not self.slack_client:
            return False

        color_map = {
            AlertSeverity.INFO: '#36a64f',
            AlertSeverity.WARNING: '#ff9900',
            AlertSeverity.CRITICAL: '#ff0000',
        }

        severity_emoji = {
            AlertSeverity.INFO: 'ℹ️',
            AlertSeverity.WARNING: '⚠️',
            AlertSeverity.CRITICAL: '🚨',
        }

        try:
            blocks = [
                {
                    'type': 'header',
                    'text': {
                        'type': 'plain_text',
                        'text': f'{severity_emoji[severity]} {severity.value.upper()}: {title}',
                    }
                },
                {
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': message
                    }
                },
            ]

            if context:
                context_text = '\n'.join([f'• {k}: {v}' for k, v in context.items()])
                blocks.append({
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': f'*Context:*\n{context_text}'
                    }
                })

            blocks.append({
                'type': 'context',
                'elements': [
                    {
                        'type': 'mrkdwn',
                        'text': f'_Timestamp: {datetime.now().isoformat()}_'
                    }
                ]
            })

            self.slack_client.chat_postMessage(
                channel=self.slack_alerts_channel,
                blocks=blocks,
            )
            return True
        except SlackApiError as e:
            print(f'Slack API error: {e}')
            return False

    def trigger_pagerduty_incident(
        self,
        title: str,
        description: str,
        severity: AlertSeverity = AlertSeverity.CRITICAL,
        context: Optional[Dict] = None
    ) -> bool:
        """Trigger PagerDuty incident"""
        if not self.pagerduty_key:
            return False

        try:
            payload = {
                'routing_key': self.pagerduty_key,
                'event_action': 'trigger',
                'dedup_key': f'{title}-{datetime.now().timestamp()}',
                'payload': {
                    'summary': title,
                    'severity': 'critical' if severity == AlertSeverity.CRITICAL else 'warning',
                    'source': 'Immo2000',
                    'custom_details': {
                        'description': description,
                        'context': context or {},
                        'timestamp': datetime.now().isoformat(),
                    }
                }
            }

            response = requests.post(
                'https://events.pagerduty.com/v2/enqueue',
                json=payload,
                timeout=5
            )
            return response.status_code == 202
        except requests.exceptions.RequestException as e:
            print(f'PagerDuty error (request): {e}')
            return False
        except Exception as e:
            print(f'PagerDuty error: {e}')
            return False

    def alert_high_error_rate(self, error_rate: float, error_count: int):
        """Alert when error rate is high"""
        self.send_slack_alert(
            title='High Error Rate Detected',
            message=f'Error rate: `{error_rate:.2f}%` ({error_count} errors in last 5 minutes)',
            severity=AlertSeverity.CRITICAL,
            context={
                'metric': 'error_rate',
                'threshold': '5%',
                'current': f'{error_rate:.2f}%',
            }
        )

        if error_rate > 10:
            self.trigger_pagerduty_incident(
                title='High Error Rate Detected',
                description=f'Error rate: {error_rate:.2f}% ({error_count} errors)',
                context={'error_count': error_count, 'error_rate': error_rate}
            )

    def alert_slow_response(self, endpoint: str, response_time: float, threshold: float):
        """Alert when API response is slow"""
        self.send_slack_alert(
            title='Slow API Response Detected',
            message=f'Endpoint `{endpoint}` took `{response_time:.0f}ms` (threshold: `{threshold:.0f}ms`)',
            severity=AlertSeverity.WARNING,
            context={
                'endpoint': endpoint,
                'response_time': f'{response_time:.0f}ms',
                'threshold': f'{threshold:.0f}ms',
            }
        )

    def alert_database_issue(self, issue: str, details: Optional[Dict] = None):
        """Alert database issues"""
        self.send_slack_alert(
            title='Database Issue Detected',
            message=f'Issue: {issue}',
            severity=AlertSeverity.CRITICAL,
            context=details
        )

        self.trigger_pagerduty_incident(
            title='Database Issue Detected',
            description=issue,
            context=details
        )

    def alert_memory_usage(self, usage_percent: float):
        """Alert high memory usage"""
        severity = AlertSeverity.CRITICAL if usage_percent > 90 else AlertSeverity.WARNING
        self.send_slack_alert(
            title='High Memory Usage',
            message=f'Memory usage: `{usage_percent:.1f}%`',
            severity=severity,
            context={'memory_usage': f'{usage_percent:.1f}%'}
        )

    def alert_disk_space(self, available_gb: float):
        """Alert low disk space"""
        self.send_slack_alert(
            title='Low Disk Space',
            message=f'Available space: `{available_gb:.1f} GB`',
            severity=AlertSeverity.CRITICAL,
            context={'available_gb': available_gb}
        )

        self.trigger_pagerduty_incident(
            title='Low Disk Space',
            description=f'Only {available_gb:.1f} GB available'
        )

# Global instance
_alert_service = None

def get_alert_service() -> AlertService:
    global _alert_service
    if _alert_service is None:
        _alert_service = AlertService()
    return _alert_service
