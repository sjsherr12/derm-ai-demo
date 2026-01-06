import Constants from 'expo-constants'
import { Platform } from 'react-native'

export const AuthIntent = Object.freeze({
    SignIn: 'sign_in',
    SignUp: 'sign_up',
    Unknown: 'unk'
})

export const SupportEmail = 'contact@derm-ai.app'

export const AppleSTDEula = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
export const TermsOfUseLink = Platform.OS === 'ios' ? AppleSTDEula : 'https://derm-ai.app/terms-of-service'
export const PrivacyPolicyLink = 'https://derm-ai.app/privacy-policy'