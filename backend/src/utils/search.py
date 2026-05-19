"""
Intégration Elasticsearch pour la recherche avancée et full-text
"""

from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class SearchEngine:
    """Moteur de recherche Elasticsearch"""

    def __init__(self, es_url='http://localhost:9200'):
        self.es = Elasticsearch([es_url])
        self.index_name = 'listings'
        self.ensure_index_exists()

    def ensure_index_exists(self):
        """Créer l'index s'il n'existe pas"""
        if not self.es.indices.exists(index=self.index_name):
            self.es.indices.create(
                index=self.index_name,
                body={
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0,
                        "analysis": {
                            "analyzer": {
                                "french_analyzer": {
                                    "type": "standard",
                                    "stopwords": "_french_"
                                }
                            }
                        }
                    },
                    "mappings": {
                        "properties": {
                            "id": {"type": "integer"},
                            "title": {
                                "type": "text",
                                "analyzer": "french_analyzer",
                                "boost": 3
                            },
                            "description": {
                                "type": "text",
                                "analyzer": "french_analyzer",
                                "boost": 2
                            },
                            "address": {
                                "type": "text",
                                "analyzer": "french_analyzer"
                            },
                            "city": {
                                "type": "keyword"
                            },
                            "postal_code": {
                                "type": "keyword"
                            },
                            "type": {
                                "type": "keyword"
                            },
                            "price": {
                                "type": "integer"
                            },
                            "surface": {
                                "type": "integer"
                            },
                            "rooms": {
                                "type": "integer"
                            },
                            "bedrooms": {
                                "type": "integer"
                            },
                            "bathrooms": {
                                "type": "integer"
                            },
                            "seller_id": {
                                "type": "integer"
                            },
                            "created_at": {
                                "type": "date"
                            },
                            "updated_at": {
                                "type": "date"
                            },
                            "is_active": {
                                "type": "boolean"
                            },
                            "location": {
                                "type": "geo_point"
                            }
                        }
                    }
                }
            )
            logger.info(f"Index {self.index_name} créé")

    def index_listing(self, listing):
        """Indexer une annonce"""
        try:
            doc = {
                'id': listing.id,
                'title': listing.title,
                'description': listing.description,
                'address': listing.address,
                'city': listing.city,
                'postal_code': listing.postal_code,
                'type': listing.type,
                'price': listing.price,
                'surface': listing.surface,
                'rooms': listing.rooms or 0,
                'bedrooms': listing.bedrooms or 0,
                'bathrooms': listing.bathrooms or 0,
                'seller_id': listing.seller_id,
                'created_at': listing.created_at.isoformat() if listing.created_at else datetime.utcnow().isoformat(),
                'updated_at': listing.updated_at.isoformat() if listing.updated_at else datetime.utcnow().isoformat(),
                'is_active': listing.is_active,
            }

            self.es.index(index=self.index_name, id=listing.id, body=doc)
            logger.debug(f"Listing {listing.id} indexé")
            return True

        except Exception as e:
            logger.error(f"Erreur indexation listing {listing.id}: {str(e)}")
            return False

    def bulk_index_listings(self, listings):
        """Indexer plusieurs annonces en masse"""
        try:
            actions = []
            for listing in listings:
                action = {
                    "_index": self.index_name,
                    "_id": listing.id,
                    "_source": {
                        'id': listing.id,
                        'title': listing.title,
                        'description': listing.description,
                        'address': listing.address,
                        'city': listing.city,
                        'postal_code': listing.postal_code,
                        'type': listing.type,
                        'price': listing.price,
                        'surface': listing.surface,
                        'rooms': listing.rooms or 0,
                        'bedrooms': listing.bedrooms or 0,
                        'bathrooms': listing.bathrooms or 0,
                        'seller_id': listing.seller_id,
                        'created_at': listing.created_at.isoformat() if listing.created_at else datetime.utcnow().isoformat(),
                        'updated_at': listing.updated_at.isoformat() if listing.updated_at else datetime.utcnow().isoformat(),
                        'is_active': listing.is_active,
                    }
                }
                actions.append(action)

            success, failed = bulk(self.es, actions, raise_on_error=False)
            logger.info(f"Bulk indexation: {success} réussi(s), {failed} échoué(s)")
            return success

        except Exception as e:
            logger.error(f"Erreur bulk indexation: {str(e)}")
            return 0

    def delete_listing(self, listing_id):
        """Supprimer une annonce de l'index"""
        try:
            self.es.delete(index=self.index_name, id=listing_id)
            logger.debug(f"Listing {listing_id} supprimé de l'index")
            return True

        except Exception as e:
            logger.error(f"Erreur suppression listing {listing_id}: {str(e)}")
            return False

    def search(self, query=None, filters=None, sort=None, size=50, from_=0):
        """
        Rechercher des annonces avec filtres avancés.

        Args:
            query: Terme de recherche full-text
            filters: Dict avec les filtres (prix_min, prix_max, surface_min, etc.)
            sort: Critère de tri (prix, date, etc.)
            size: Nombre de résultats
            from_: Offset pour la pagination

        Returns:
            List des annonces trouvées avec le score de pertinence
        """
        try:
            must_clauses = []
            filter_clauses = []

            # Recherche full-text
            if query:
                must_clauses.append({
                    "multi_match": {
                        "query": query,
                        "fields": ["title^3", "description^2", "address", "city"],
                        "analyzer": "french_analyzer"
                    }
                })

            # Filtre: actif par défaut
            filter_clauses.append({"term": {"is_active": True}})

            # Filtres optionnels
            if filters:
                if 'type' in filters and filters['type']:
                    filter_clauses.append({"term": {"type": filters['type']}})

                if 'city' in filters and filters['city']:
                    filter_clauses.append({"match": {"city": filters['city']}})

                if 'postal_code' in filters and filters['postal_code']:
                    filter_clauses.append({"term": {"postal_code": filters['postal_code']}})

                # Filtres de plage de prix
                if filters.get('price_min') or filters.get('price_max'):
                    price_range = {}
                    if filters.get('price_min'):
                        price_range['gte'] = filters['price_min']
                    if filters.get('price_max'):
                        price_range['lte'] = filters['price_max']
                    filter_clauses.append({"range": {"price": price_range}})

                # Filtres de plage de surface
                if filters.get('surface_min') or filters.get('surface_max'):
                    surface_range = {}
                    if filters.get('surface_min'):
                        surface_range['gte'] = filters['surface_min']
                    if filters.get('surface_max'):
                        surface_range['lte'] = filters['surface_max']
                    filter_clauses.append({"range": {"surface": surface_range}})

                # Filtres nombre de pièces
                if filters.get('rooms_min') or filters.get('rooms_max'):
                    rooms_range = {}
                    if filters.get('rooms_min'):
                        rooms_range['gte'] = filters['rooms_min']
                    if filters.get('rooms_max'):
                        rooms_range['lte'] = filters['rooms_max']
                    filter_clauses.append({"range": {"rooms": rooms_range}})

                if filters.get('bedrooms'):
                    filter_clauses.append({"range": {"bedrooms": {"gte": filters['bedrooms']}}})

            # Construire la query Elasticsearch
            body = {
                "query": {
                    "bool": {
                        "must": must_clauses if must_clauses else [{"match_all": {}}],
                        "filter": filter_clauses
                    }
                },
                "size": size,
                "from": from_
            }

            # Ajouter le tri
            if sort:
                sort_mapping = {
                    'price_asc': {"price": {"order": "asc"}},
                    'price_desc': {"price": {"order": "desc"}},
                    'date_newest': {"created_at": {"order": "desc"}},
                    'date_oldest': {"created_at": {"order": "asc"}},
                    'surface_asc': {"surface": {"order": "asc"}},
                    'surface_desc': {"surface": {"order": "desc"}},
                    'relevance': {"_score": {"order": "desc"}},
                }
                if sort in sort_mapping:
                    body["sort"] = [sort_mapping[sort]]

            # Exécuter la recherche
            response = self.es.search(index=self.index_name, body=body)

            results = []
            total = response['hits']['total']['value']

            for hit in response['hits']['hits']:
                source = hit['_source']
                source['score'] = hit['_score']
                results.append(source)

            return {
                'total': total,
                'hits': results,
                'page': from_ // size + 1,
                'pages': (total + size - 1) // size
            }

        except Exception as e:
            logger.error(f"Erreur recherche: {str(e)}")
            return {
                'total': 0,
                'hits': [],
                'error': str(e)
            }

    def get_suggestions(self, query, field='title'):
        """Obtenir des suggestions de recherche"""
        try:
            body = {
                "suggest": {
                    "title-suggest": {
                        "text": query,
                        "completion": {
                            "field": field
                        }
                    }
                }
            }

            response = self.es.search(index=self.index_name, body=body)
            suggestions = response['suggest']['title-suggest'][0]['options']
            return [s['text'] for s in suggestions]

        except Exception as e:
            logger.error(f"Erreur suggestions: {str(e)}")
            return []

    def get_statistics(self):
        """Obtenir les statistiques de l'index"""
        try:
            count = self.es.count(index=self.index_name)['count']
            stats = self.es.indices.stats(index=self.index_name)

            return {
                'total_documents': count,
                'index_size': stats['indices'][self.index_name]['primaries']['store']['size_in_bytes']
            }

        except Exception as e:
            logger.error(f"Erreur statistiques: {str(e)}")
            return {}


# Initialiser le moteur de recherche
search_engine = None


def init_search_engine(es_url='http://localhost:9200'):
    """Initialiser le moteur de recherche"""
    global search_engine
    search_engine = SearchEngine(es_url)
    return search_engine


def get_search_engine():
    """Obtenir le moteur de recherche"""
    return search_engine


def sync_all_listings():
    """
    Synchroniser toutes les annonces actives avec Elasticsearch.
    À appeler une seule fois au démarrage ou après une migration.
    """
    try:
        from src.auth.models import Listing

        engine = get_search_engine()
        if not engine:
            logger.warning("Moteur de recherche non initialisé")
            return 0

        listings = Listing.query.filter_by(is_active=True).all()
        count = engine.bulk_index_listings(listings)

        logger.info(f"Synchronisation Elasticsearch: {count} annonces indexées")
        return count

    except Exception as e:
        logger.error(f"Erreur synchronisation: {str(e)}")
        return 0
