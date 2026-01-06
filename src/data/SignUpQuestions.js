import ReadyToGenerateAnimation from "../components/Graphics/SignUp/ReadyToGenerate";
import AnimationTransition from "../components/Graphics/SignUp/AnimationTransition";
import AidedInputQuestion from "../components/Questions/SignUp/AidedInputQuestion";
import ButtonQuestion from "../components/Questions/SignUp/ButtonQuestion";
import DatePickerQuestion from "../components/Questions/SignUp/DatePickerQuestion";
import DescriptiveQuestion from "../components/Questions/SignUp/DescriptiveQuestion";
import SelectAllQuestion from "../components/Questions/SignUp/SelectAllQuestion";
import { AgeGroups, BreakoutLocations, BreakoutPainSeverities, CommonAllergens, CommonMedications, DiscoverySources, Genders, GenericClimates, SkincareGoals, SkinConcerns, SkinSensitivities, SkinTones, SkinTypes } from "../constants/signup";
import EnableNotifications from "components/Questions/SignUp/EnableNotifications";
import AppStoreRating from "components/Questions/SignUp/AppStoreRating";
import ReferralCodeQuestion, { ReferralCodeQuestionBottom } from "../components/Questions/SignUp/ReferralCodeQuestion";
import ScanPhotosQuestion from "../components/Questions/SignUp/ScanPhotosQuestion";

const SignUpQuestions = [
    {
        id: 'GenderQuestion',
        Type: ButtonQuestion,
        title: 'What is your gender?',
        description:'This helps us understand hormonal and skin structure differences.',
        field:'profile.gender',
        options: Genders,
    },
    {
        id:'AgeQuestion',
        Type:ButtonQuestion,
        title:'What is your age?',
        description: 'This will be used to calibrate your custom skincare plan.',
        field:'profile.age',
        options:AgeGroups,
    },
    {
        id:'SkinTypeQuestion',
        Type:DescriptiveQuestion,
        title:'What is your skin type?',
        description:'This helps us recommend the best products for your needs.',
        field:'profile.skinInfo.skinType',
        options: SkinTypes,
    },
    {
        id:'SkinToneQuestion',
        Type:DescriptiveQuestion,
        title:'What is your skin tone?',
        description:'This will be used to calibrate your custom skincare plan.',
        field:'profile.skinInfo.skinTone',
        options: SkinTones,
    },
    {
        id:'SkinSensitivityQuestion',
        Type:DescriptiveQuestion,
        title:'How sensitive is your skin?',
        description:'This helps us determine the most beneficial ingredients for you.',
        field:'profile.skinInfo.sensitivity',
        options: SkinSensitivities,
    },
    {
        id:'SkinCharacteristicsTransition',
        Type:AnimationTransition,
        title:'Derm AI creates real skincare progress',
        description:'See faster, more consistent results with a routine built on analysis — not guesswork.',
        notRequired:true,
        source:null,
    },
    // {
    //     id:'SkinConcernsTransition',
    //     Type:AnimationTransition,
    //     title:'Next, let’s talk about your skin concerns.',
    //     notRequired:true,
    //     source:null,
    // },
    {
        id:'SkinConcernsQuestion',
        Type:SelectAllQuestion,
        title:'What are your main skin concerns?',
        description:'Select all that apply.',
        field:'profile.skinInfo.skinConcerns',
        options: SkinConcerns,
    },
    {
        id:'BreakoutLocationsQuestion',
        Type:SelectAllQuestion,
        title:'Where do you have breakouts mostly?',
        description:'Select all that apply.',
        field:'profile.skinInfo.breakoutLocations',
        options: BreakoutLocations,
    },
    // {
    //     id:'BreakoutPainSeverityQuestion',
    //     Type:DescriptiveQuestion,
    //     title:'How painful do your breakouts feel?',
    //     description:'Pain and inflammation can help us understand the severity of your breakouts.',
    //     field:'profile.skinInfo.breakoutSeverity',
    //     options: BreakoutPainSeverities,
    // },
    // {
    //     id:'MedicationRoutineQuestion',
    //     Type:AidedInputQuestion,
    //     element:'medications',
    //     title:'Do you take any medications?',
    //     description:'Certain medications may affect your skin.',
    //     field:'profile.skinInfo.medications',
    //     options: CommonMedications,
    //     notRequired:true,
    // },
    // {
    //     id:'MakeupUsageQuestion',
    //     Type:ButtonQuestion,
    //     title:'Do you wear makeup regularly?',
    //     description:'We ask this question to everyone because makeup can have a significant impact on skin health.',
    //     options: {
    //         "Yes": {
    //             icon: "thumbs-up-outline",
    //             value: true,
    //         },
    //         "No": {
    //             icon: "thumbs-down-outline",
    //             value: false,
    //         }
    //     }
    // },
    {
        id:'TypicalClimateQuestion',
        Type:DescriptiveQuestion,
        title:'What is your typical climate?',
        description:'This helps us understand how your environment might affect your skin.',
        field:'profile.skinInfo.climate',
        options:GenericClimates,
    },
    {
        id:'KnownAllergensQuestion',
        Type:SelectAllQuestion,
        element:'ingredients',
        title:'Select allergies or ingredients to avoid.',
        description:'Select ingredients you’re allergic to or want to avoid.',
        field:'profile.skinInfo.sensitivities',
        options: CommonAllergens,
    },
    {
        id:'SkinCareGoalsQuestion',
        Type:SelectAllQuestion,
        title:'What are your main skincare goals?',
        description:'Select all that apply.',
        field:'profile.skinInfo.skincareGoals',
        options: SkincareGoals,
    },
    // {
    //     id:'PersonalizePlatformTransition',
    //     Type:AnimationTransition,
    //     title:'Your custom path to healthier skin',
    //     description:'Track your skin’s progress over time with personalized analytics and reports.',
    //     notRequired:true,
    //     source:null,
    // },
    {
        id:'SkincareRoutineTransition',
        Type:AnimationTransition,
        title:'Accurate diagnoses without the visit',
        description:'Get AI-powered skin assessments based on facial scans all from your phone.',
        notRequired:true,
        source:null,
    },
    {
        id:'ScanPhotosQuestion',
        Type:ScanPhotosQuestion,
        title:'Time for a quick facial scan',
        description:'Take a few photos to help us design your unique skincare plan.'
    },
    { // must not be the last question (or it can be but the file enablenotifications has to be modified)
        id:'EnableNotificationsOption',
        Type:EnableNotifications,
        title:'Enable notifications',
        description:'Get reminders for your next scan and important updates.',
        field:'notifications.enabled',
    },
    {
        id:'DiscoverySourceQuestion',
        Type:ButtonQuestion,
        title:'How did you hear about Derm AI?',
        description:'We’re curious to know!',
        field:'extra.utmSource',
        options:DiscoverySources,
    },
    {
        id:'AppStoreRatingPrompt',
        Type:AppStoreRating,
        title: 'Give us a rating!',
        description: 'Share your experience to help others discover clearer, healthier skin!',
        notRequired:true,
    },
    {
        id:'ReferralCodeQuestion',
        Type:ReferralCodeQuestion,
        Bottom: ReferralCodeQuestionBottom,
        title: 'Enter a referral code',
        description: 'You can skip this step if you don’t have one.',
        notRequired:true,
    },
];

export default SignUpQuestions;