// Language Support for ChopSmo - Cameroon-Based App
// Supporting English, French, and Pidgin English (common languages in Cameroon)

const languages = {
    en: {
        code: 'en',
        name: 'English',
        flag: '🇬🇧',
        translations: {
            // Navigation
            'nav.home': 'Home',
            'nav.about': 'About',
            'nav.recipes': 'Recipes',
            'nav.meal-plans': 'Meal Plans',
            'nav.contact': 'Contact',
            'nav.dashboard': 'Dashboard',
            'nav.profile': 'Profile',
            'nav.login': 'Login',
            'nav.signup': 'Sign Up',
            'nav.logout': 'Logout',
            
            // General
            'general.welcome': 'Welcome',
            'general.loading': 'Loading...',
            'general.save': 'Save',
            'general.cancel': 'Cancel',
            'general.delete': 'Delete',
            'general.edit': 'Edit',
            'general.view': 'View',
            'general.search': 'Search',
            'general.filter': 'Filter',
            'general.close': 'Close',
            'general.yes': 'Yes',
            'general.no': 'No',
            
            // Hero Section
            'hero.title': 'Smart Meal Planning for Cameroon',
            'hero.subtitle': 'Discover authentic Cameroonian recipes, plan your meals, and eat healthily with ChopSmo - your personal cooking companion.',
            'hero.cta.primary': 'Start Cooking',
            'hero.cta.secondary': 'Explore Recipes',
            
            // Features
            'features.title': 'Why Choose ChopSmo?',
            'features.recipe.title': 'Authentic Recipes',
            'features.recipe.desc': 'Discover traditional Cameroonian dishes and modern twists',
            'features.plan.title': 'Smart Planning',
            'features.plan.desc': 'Plan your meals efficiently with our intelligent system',
            'features.nutrition.title': 'Nutrition Tracking',
            'features.nutrition.desc': 'Track your nutritional intake and health goals',
            
            // Auth Pages
            'auth.login.title': 'Welcome Back',
            'auth.login.subtitle': 'Sign in to your ChopSmo account',
            'auth.signup.title': 'Join ChopSmo',
            'auth.signup.subtitle': 'Start your culinary journey today',
            'auth.email': 'Email',
            'auth.password': 'Password',
            'auth.confirm-password': 'Confirm Password',
            'auth.name': 'Full Name',
            'auth.phone': 'Phone Number',
            'auth.login.button': 'Sign In',
            'auth.signup.button': 'Create Account',
            'auth.forgot-password': 'Forgot Password?',
            'auth.no-account': "Don't have an account?",
            'auth.have-account': 'Already have an account?',
            
            // Profile
            'profile.title': 'My Profile',
            'profile.edit': 'Edit Profile',
            'profile.save': 'Save Changes',
            'profile.personal-info': 'Personal Information',
            'profile.dietary-preferences': 'Dietary Preferences',
            'profile.notifications': 'Notification Settings',
            
            // Meal Suggestions
            'meal.title': 'Meal Suggestions',
            'meal.subtitle': 'Discover delicious Cameroonian meals tailored to your taste',
            'meal.filter.dietary': 'Dietary Preferences',
            'meal.filter.cuisine': 'Cuisine Type',
            'meal.filter.time': 'Cooking Time',
            'meal.ingredients.add': 'Add Ingredients',
            'meal.ingredients.placeholder': 'Enter ingredients you have...',
            'meal.search.placeholder': 'Search for recipes...',
            'meal.nutrition.calories': 'Calories',
            'meal.nutrition.protein': 'Protein',
            'meal.nutrition.carbs': 'Carbs',
            'meal.nutrition.fat': 'Fat',
            
            // Footer
            'footer.about': 'About ChopSmo',
            'footer.contact': 'Contact Us',
            'footer.privacy': 'Privacy Policy',
            'footer.terms': 'Terms of Service',
            'footer.copyright': '© 2025 ChopSmo. All rights reserved.',
            'footer.made-in': 'Made with ❤️ in Cameroon'
        }
    },
    
    fr: {
        code: 'fr',
        name: 'Français',
        flag: '🇫🇷',
        translations: {
            // Navigation
            'nav.home': 'Accueil',
            'nav.about': 'À propos',
            'nav.recipes': 'Recettes',
            'nav.meal-plans': 'Plans de repas',
            'nav.contact': 'Contact',
            'nav.dashboard': 'Tableau de bord',
            'nav.profile': 'Profil',
            'nav.login': 'Connexion',
            'nav.signup': "S'inscrire",
            'nav.logout': 'Déconnexion',
            
            // General
            'general.welcome': 'Bienvenue',
            'general.loading': 'Chargement...',
            'general.save': 'Enregistrer',
            'general.cancel': 'Annuler',
            'general.delete': 'Supprimer',
            'general.edit': 'Modifier',
            'general.view': 'Voir',
            'general.search': 'Rechercher',
            'general.filter': 'Filtrer',
            'general.close': 'Fermer',
            'general.yes': 'Oui',
            'general.no': 'Non',
            
            // Hero Section
            'hero.title': 'Planification Intelligente des Repas pour le Cameroun',
            'hero.subtitle': 'Découvrez des recettes camerounaises authentiques, planifiez vos repas et mangez sainement avec ChopSmo - votre compagnon culinaire personnel.',
            'hero.cta.primary': 'Commencer à Cuisiner',
            'hero.cta.secondary': 'Explorer les Recettes',
            
            // Features
            'features.title': 'Pourquoi Choisir ChopSmo?',
            'features.recipe.title': 'Recettes Authentiques',
            'features.recipe.desc': 'Découvrez les plats traditionnels camerounais et leurs variantes modernes',
            'features.plan.title': 'Planification Intelligente',
            'features.plan.desc': 'Planifiez vos repas efficacement avec notre système intelligent',
            'features.nutrition.title': 'Suivi Nutritionnel',
            'features.nutrition.desc': 'Suivez votre apport nutritionnel et vos objectifs de santé',
            
            // Auth Pages
            'auth.login.title': 'Bon Retour',
            'auth.login.subtitle': 'Connectez-vous à votre compte ChopSmo',
            'auth.signup.title': 'Rejoignez ChopSmo',
            'auth.signup.subtitle': 'Commencez votre voyage culinaire aujourd\'hui',
            'auth.email': 'E-mail',
            'auth.password': 'Mot de passe',
            'auth.confirm-password': 'Confirmer le mot de passe',
            'auth.name': 'Nom complet',
            'auth.phone': 'Numéro de téléphone',
            'auth.login.button': 'Se connecter',
            'auth.signup.button': 'Créer un compte',
            'auth.forgot-password': 'Mot de passe oublié?',
            'auth.no-account': "Vous n'avez pas de compte?",
            'auth.have-account': 'Vous avez déjà un compte?',
            
            // Profile
            'profile.title': 'Mon Profil',
            'profile.edit': 'Modifier le Profil',
            'profile.save': 'Enregistrer les Modifications',
            'profile.personal-info': 'Informations Personnelles',
            'profile.dietary-preferences': 'Préférences Alimentaires',
            'profile.notifications': 'Paramètres de Notification',
            
            // Meal Suggestions
            'meal.title': 'Suggestions de Repas',
            'meal.subtitle': 'Découvrez de délicieux repas camerounais adaptés à vos goûts',
            'meal.filter.dietary': 'Préférences Alimentaires',
            'meal.filter.cuisine': 'Type de Cuisine',
            'meal.filter.time': 'Temps de Cuisson',
            'meal.ingredients.add': 'Ajouter des Ingrédients',
            'meal.ingredients.placeholder': 'Entrez les ingrédients que vous avez...',
            'meal.search.placeholder': 'Rechercher des recettes...',
            'meal.nutrition.calories': 'Calories',
            'meal.nutrition.protein': 'Protéines',
            'meal.nutrition.carbs': 'Glucides',
            'meal.nutrition.fat': 'Lipides',
            
            // Footer
            'footer.about': 'À propos de ChopSmo',
            'footer.contact': 'Nous Contacter',
            'footer.privacy': 'Politique de Confidentialité',
            'footer.terms': 'Conditions de Service',
            'footer.copyright': '© 2025 ChopSmo. Tous droits réservés.',
            'footer.made-in': 'Fait avec ❤️ au Cameroun'
        }
    },
    
    // Pidgin English (Cameroonian Pidgin)
    pidgin: {
        code: 'pidgin',
        name: 'Pidgin',
        flag: '🇨🇲',
        translations: {
            // Navigation
            'nav.home': 'Home',
            'nav.about': 'About We',
            'nav.recipes': 'How For Cook',
            'nav.meal-plans': 'Food Plan',
            'nav.contact': 'Contact We',
            'nav.dashboard': 'Dashboard',
            'nav.profile': 'My Profile',
            'nav.login': 'Login',
            'nav.signup': 'Sign Up',
            'nav.logout': 'Logout',
            
            // General
            'general.welcome': 'Welcome',
            'general.loading': 'E dey load...',
            'general.save': 'Save Am',
            'general.cancel': 'Cancel',
            'general.delete': 'Delete Am',
            'general.edit': 'Edit Am',
            'general.view': 'See Am',
            'general.search': 'Find Am',
            'general.filter': 'Filter',
            'general.close': 'Close Am',
            'general.yes': 'Yes',
            'general.no': 'No',
            
            // Hero Section
            'hero.title': 'Smart Food Planning For Cameroon',
            'hero.subtitle': 'Find fine Cameroon food, plan your chop, and eat well with ChopSmo - your cooking padi.',
            'hero.cta.primary': 'Start Cook',
            'hero.cta.secondary': 'See Food Dem',
            
            // Features
            'features.title': 'Why You Go Choose ChopSmo?',
            'features.recipe.title': 'Real Cameroon Food',
            'features.recipe.desc': 'Find the real Cameroon food wey we dey chop',
            'features.plan.title': 'Smart Planning',
            'features.plan.desc': 'Plan your food well well with we system',
            'features.nutrition.title': 'Health Check',
            'features.nutrition.desc': 'Check wetin you dey eat and your health',
            
            // Auth Pages
            'auth.login.title': 'Welcome Back',
            'auth.login.subtitle': 'Login for your ChopSmo account',
            'auth.signup.title': 'Join ChopSmo',
            'auth.signup.subtitle': 'Start your cooking journey today',
            'auth.email': 'Email',
            'auth.password': 'Password',
            'auth.confirm-password': 'Confirm Password',
            'auth.name': 'Your Name',
            'auth.phone': 'Phone Number',
            'auth.login.button': 'Login',
            'auth.signup.button': 'Create Account',
            'auth.forgot-password': 'You forget password?',
            'auth.no-account': 'You no get account?',
            'auth.have-account': 'You don get account?',
            
            // Profile
            'profile.title': 'My Profile',
            'profile.edit': 'Edit Profile',
            'profile.save': 'Save Changes',
            'profile.personal-info': 'Personal Info',
            'profile.dietary-preferences': 'Food Preference',
            'profile.notifications': 'Notification Settings',
            
            // Meal Suggestions
            'meal.title': 'Food Suggestions',
            'meal.subtitle': 'Find fine Cameroon food wey go sweet for your mouth',
            'meal.filter.dietary': 'Food Preference',
            'meal.filter.cuisine': 'Food Type',
            'meal.filter.time': 'Cooking Time',
            'meal.ingredients.add': 'Add Ingredients',
            'meal.ingredients.placeholder': 'Put the thing wey you get...',
            'meal.search.placeholder': 'Find food...',
            'meal.nutrition.calories': 'Calories',
            'meal.nutrition.protein': 'Protein',
            'meal.nutrition.carbs': 'Carbs',
            'meal.nutrition.fat': 'Fat',
            
            // Footer
            'footer.about': 'About ChopSmo',
            'footer.contact': 'Contact We',
            'footer.privacy': 'Privacy Policy',
            'footer.terms': 'Terms of Service',
            'footer.copyright': '© 2025 ChopSmo. All rights reserved.',
            'footer.made-in': 'Make with ❤️ for Cameroon'
        }
    }
};

// Language Manager Class
class LanguageManager {
    constructor() {
        this.currentLanguage = this.getStoredLanguage() || 'en';
        this.languages = languages;
        this.init();
    }
    
    init() {
        // Initialize language on page load
        this.updatePageLanguage();
        this.createLanguageSwitcher();
    }
    
    getStoredLanguage() {
        return localStorage.getItem('chopsmo-language');
    }
    
    setLanguage(languageCode) {
        if (this.languages[languageCode]) {
            this.currentLanguage = languageCode;
            localStorage.setItem('chopsmo-language', languageCode);
            this.updatePageLanguage();
            
            // Trigger language change event
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: languageCode }
            }));
        }
    }
    
    translate(key) {
        const translation = this.languages[this.currentLanguage]?.translations[key];
        return translation || key;
    }
    
    updatePageLanguage() {
        // Update all elements with data-translate attribute
        const translateElements = document.querySelectorAll('[data-translate]');
        translateElements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update document title if it has translation key
        if (document.title.startsWith('data-translate:')) {
            const key = document.title.replace('data-translate:', '');
            document.title = this.translate(key);
        }
    }
    
    createLanguageSwitcher() {
        // Create language switcher if it doesn't exist
        let switcher = document.getElementById('language-switcher');
        if (!switcher) {
            switcher = document.createElement('div');
            switcher.id = 'language-switcher';
            switcher.className = 'language-switcher';
            
            // Create language buttons
            Object.values(this.languages).forEach(lang => {
                const button = document.createElement('button');
                button.className = `lang-btn ${lang.code === this.currentLanguage ? 'active' : ''}`;
                button.innerHTML = `${lang.flag} ${lang.name}`;
                button.onclick = () => this.setLanguage(lang.code);
                switcher.appendChild(button);
            });
            
            // Try to insert in navigation or header
            const nav = document.querySelector('nav') || document.querySelector('header');
            if (nav) {
                nav.appendChild(switcher);
            }
        }
    }
    
    getCurrentLanguage() {
        return this.languages[this.currentLanguage];
    }
}

// Initialize language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});

// Helper function for easy translation access
function t(key) {
    return window.languageManager ? window.languageManager.translate(key) : key;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LanguageManager, languages };
}
