import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricType {
  fingerprint: boolean;
  faceRecognition: boolean;
  iris: boolean;
}

export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    return await LocalAuthentication.hasHardwareAsync();
  } catch (error) {
    console.error('Biometric hardware check error:', error);
    return false;
  }
};

export const getAvailableBiometrics = async (): Promise<LocalAuthentication.AuthenticationType[]> => {
  try {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  } catch (error) {
    console.error('Get biometrics error:', error);
    return [];
  }
};

export const authenticate = async (reason: string = 'Authentifiez-vous'): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      throw new Error('Device does not support biometric authentication');
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      throw new Error('No biometric enrolled on this device');
    }

    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
      reason,
    });

    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

export const enrollBiometric = async (): Promise<boolean> => {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!enrolled) {
      // Direct user to settings to enroll
      throw new Error('Please enroll biometric in device settings');
    }

    return true;
  } catch (error) {
    console.error('Enroll biometric error:', error);
    return false;
  }
};
