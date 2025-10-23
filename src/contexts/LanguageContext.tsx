import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Translation function
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Translations
const translations = {
  en: {
    // Common
    common: {
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      loading: 'Loading...',
      search: 'Search',
      filter: 'Filter',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      phone: 'Phone Number',
      address: 'Address',
      location: 'Location',
      status: 'Status',
      actions: 'Actions',
      view: 'View',
      download: 'Download',
      upload: 'Upload',
      photo: 'Photo',
      notes: 'Notes',
      description: 'Description',
      date: 'Date',
      time: 'Time',
    },
    
    // Navigation
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      reports: 'Reports',
      residents: 'Residents',
      technicians: 'Technicians',
      waterControllers: 'Water Controllers',
      schedules: 'Schedules',
      profile: 'Profile',
      settings: 'Settings',
    },
    
    // Auth
    auth: {
      welcomeBack: 'Welcome Back',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      createAccount: 'Create Account',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      selectRole: 'Select Role',
      resident: 'Resident',
      panchayatOfficer: 'Panchayat Officer',
      maintenanceTechnician: 'Maintenance Technician',
      waterFlowController: 'Water Flow Controller',
    },
    
    // Dashboard
    dashboard: {
      welcome: 'Welcome',
      totalReports: 'Total Reports',
      pendingReports: 'Pending Reports',
      inProgress: 'In Progress',
      completed: 'Completed',
      activeSchedules: 'Active Schedules',
      myReports: 'My Reports',
      assignedReports: 'Assigned Reports',
      recentActivity: 'Recent Activity',
    },
    
    // Reports
    reports: {
      title: 'Pipe Damage Reports',
      submitNew: 'Submit New Report',
      reportDetails: 'Report Details',
      reportId: 'Report ID',
      reporter: 'Reporter',
      reportedIssue: 'Reported Issue',
      assignedTo: 'Assigned to',
      technician: 'Technician',
      selectTechnician: 'Select Technician',
      assignTechnician: 'Assign Technician',
      viewLocation: 'View Location on Map',
      uploadPhoto: 'Upload Photo',
      takePhoto: 'Take Photo',
      completionNotes: 'Completion Notes',
      completionReport: 'Completion Report',
      markComplete: 'Mark as Complete',
      approve: 'Approve',
      reject: 'Reject',
      rejectionReason: 'Rejection Reason',
      workStarted: 'Work Started',
      workCompleted: 'Work Completed',
      submittedOn: 'Submitted on',
      completedOn: 'Completed on',
      approvedBy: 'Approved by',
      rejectedBy: 'Rejected by',
      useGPS: 'Use GPS Location',
      gettingLocation: 'Getting location...',
      locationCaptured: 'Location captured',
    },
    
    // Status
    status: {
      pending: 'Pending',
      assigned: 'Assigned',
      inProgress: 'In Progress',
      awaitingApproval: 'Awaiting Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    },
    
    // Water Schedule
    schedule: {
      title: 'Water Supply Schedule',
      createNew: 'Create New Schedule',
      area: 'Area',
      openTime: 'Open Time',
      closeTime: 'Close Time',
      scheduledOpen: 'Scheduled Open',
      scheduledClose: 'Scheduled Close',
      actualOpen: 'Actual Open',
      actualClose: 'Actual Close',
      openSupply: 'Open Water Supply',
      closeSupply: 'Close Water Supply',
      supplyOpen: 'Water Supply is OPEN',
      supplyClosed: 'Water Supply is CLOSED',
      interrupted: 'Interrupted',
      interruptReason: 'Interruption Reason',
    },
    
    // Notifications
    notifications: {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
      reportSubmitted: 'Report submitted successfully',
      technicianAssigned: 'Technician assigned successfully',
      workStarted: 'Work started successfully',
      workCompleted: 'Work completed successfully',
      reportApproved: 'Report approved successfully',
      reportRejected: 'Report rejected',
      scheduleCreated: 'Schedule created successfully',
      supplyOpened: 'Water supply opened',
      supplyClosed: 'Water supply closed',
    },
    
    // Chatbot
    chatbot: {
      title: 'BlueGrid Assistant',
      subtitle: 'Always here to help',
      placeholder: 'Type your question...',
      askAnything: 'Ask me anything about BlueGrid!',
      listen: 'Listen',
      stop: 'Stop',
      quickQuestions: 'Quick questions you can ask:',
      needHelp: 'Need help?',
    },
  },
  
  ta: {
    // Common - Tamil
    common: {
      submit: 'சமர்ப்பிக்கவும்',
      cancel: 'ரத்து செய்',
      save: 'சேமி',
      delete: 'நீக்கு',
      edit: 'திருத்து',
      close: 'மூடு',
      back: 'பின்',
      next: 'அடுத்து',
      loading: 'ஏற்றுகிறது...',
      search: 'தேடு',
      filter: 'வடிகட்டு',
      logout: 'வெளியேறு',
      login: 'உள்நுழை',
      register: 'பதிவு செய்',
      email: 'மின்னஞ்சல்',
      password: 'கடவுச்சொல்',
      confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்து',
      fullName: 'முழு பெயர்',
      phone: 'தொலைபேசி எண்',
      address: 'முகவரி',
      location: 'இடம்',
      status: 'நிலை',
      actions: 'செயல்கள்',
      view: 'பார்',
      download: 'பதிவிறக்கு',
      upload: 'பதிவேற்று',
      photo: 'புகைப்படம்',
      notes: 'குறிப்புகள்',
      description: 'விளக்கம்',
      date: 'தேதி',
      time: 'நேரம்',
    },
    
    // Navigation - Tamil
    nav: {
      home: 'முகப்பு',
      dashboard: 'கட்டுப்பாட்டு பலகை',
      reports: 'அறிக்கைகள்',
      residents: 'குடியிருப்பாளர்கள்',
      technicians: 'தொழில்நுட்ப வல்லுநர்கள்',
      waterControllers: 'நீர் கட்டுப்பாட்டாளர்கள்',
      schedules: 'அட்டவணைகள்',
      profile: 'சுயவிவரம்',
      settings: 'அமைப்புகள்',
    },
    
    // Auth - Tamil
    auth: {
      welcomeBack: 'மீண்டும் வரவேற்கிறோம்',
      signIn: 'உள்நுழைக',
      signUp: 'பதிவு செய்க',
      createAccount: 'கணக்கை உருவாக்கு',
      forgotPassword: 'கடவுச்சொல்லை மறந்துவிட்டீர்களா?',
      noAccount: 'கணக்கு இல்லையா?',
      haveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
      selectRole: 'பங்கை தேர்ந்தெடுக்கவும்',
      resident: 'குடியிருப்பாளர்',
      panchayatOfficer: 'பஞ்சாயத்து அதிகாரி',
      maintenanceTechnician: 'பராமரிப்பு தொழில்நுட்ப வல்லுநர்',
      waterFlowController: 'நீர் ஓட்ட கட்டுப்பாட்டாளர்',
    },
    
    // Dashboard - Tamil
    dashboard: {
      welcome: 'வரவேற்கிறோம்',
      totalReports: 'மொத்த அறிக்கைகள்',
      pendingReports: 'நிலுவையில் உள்ள அறிக்கைகள்',
      inProgress: 'செயல்பாட்டில்',
      completed: 'முடிந்தது',
      activeSchedules: 'செயலில் உள்ள அட்டவணைகள்',
      myReports: 'எனது அறிக்கைகள்',
      assignedReports: 'ஒதுக்கப்பட்ட அறிக்கைகள்',
      recentActivity: 'சமீபத்திய செயல்பாடு',
    },
    
    // Reports - Tamil
    reports: {
      title: 'குழாய் சேத அறிக்கைகள்',
      submitNew: 'புதிய அறிக்கையை சமர்ப்பிக்கவும்',
      reportDetails: 'அறிக்கை விவரங்கள்',
      reportId: 'அறிக்கை எண்',
      reporter: 'அறிக்கையாளர்',
      reportedIssue: 'அறிவிக்கப்பட்ட பிரச்சினை',
      assignedTo: 'ஒதுக்கப்பட்டது',
      technician: 'தொழில்நுட்ப வல்லுநர்',
      selectTechnician: 'தொழில்நுட்ப வல்லுநரை தேர்ந்தெடுக்கவும்',
      assignTechnician: 'தொழில்நுட்ப வல்லுநரை ஒதுக்கு',
      viewLocation: 'வரைபடத்தில் இடத்தைப் பார்க்கவும்',
      uploadPhoto: 'புகைப்படத்தை பதிவேற்றவும்',
      takePhoto: 'புகைப்படம் எடு',
      completionNotes: 'முடிவு குறிப்புகள்',
      completionReport: 'முடிவு அறிக்கை',
      markComplete: 'முடிந்ததாக குறி',
      approve: 'அங்கீகரி',
      reject: 'நிராகரி',
      rejectionReason: 'நிராகரிப்பு காரணம்',
      workStarted: 'வேலை தொடங்கியது',
      workCompleted: 'வேலை முடிந்தது',
      submittedOn: 'சமர்ப்பிக்கப்பட்டது',
      completedOn: 'முடிந்தது',
      approvedBy: 'அங்கீகரிக்கப்பட்டது',
      rejectedBy: 'நிராகரிக்கப்பட்டது',
      useGPS: 'GPS இடத்தைப் பயன்படுத்து',
      gettingLocation: 'இடத்தைப் பெறுகிறது...',
      locationCaptured: 'இடம் பிடிக்கப்பட்டது',
    },
    
    // Status - Tamil
    status: {
      pending: 'நிலுவையில்',
      assigned: 'ஒதுக்கப்பட்டது',
      inProgress: 'செயல்பாட்டில்',
      awaitingApproval: 'அங்கீகாரத்திற்காக காத்திருக்கிறது',
      approved: 'அங்கீகரிக்கப்பட்டது',
      rejected: 'நிராகரிக்கப்பட்டது',
      completed: 'முடிந்தது',
    },
    
    // Water Schedule - Tamil
    schedule: {
      title: 'நீர் வழங்கல் அட்டவணை',
      createNew: 'புதிய அட்டவணையை உருவாக்கு',
      area: 'பகுதி',
      openTime: 'திறக்கும் நேரம்',
      closeTime: 'மூடும் நேரம்',
      scheduledOpen: 'திட்டமிடப்பட்ட திறப்பு',
      scheduledClose: 'திட்டமிடப்பட்ட மூடல்',
      actualOpen: 'உண்மையான திறப்பு',
      actualClose: 'உண்மையான மூடல்',
      openSupply: 'நீர் வழங்கலை திற',
      closeSupply: 'நீர் வழங்கலை மூடு',
      supplyOpen: 'நீர் வழங்கல் திறந்துள்ளது',
      supplyClosed: 'நீர் வழங்கல் மூடப்பட்டுள்ளது',
      interrupted: 'தடைபட்டது',
      interruptReason: 'தடை காரணம்',
    },
    
    // Notifications - Tamil
    notifications: {
      success: 'வெற்றி',
      error: 'பிழை',
      warning: 'எச்சரிக்கை',
      info: 'தகவல்',
      reportSubmitted: 'அறிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது',
      technicianAssigned: 'தொழில்நுட்ப வல்லுநர் வெற்றிகரமாக ஒதுக்கப்பட்டார்',
      workStarted: 'வேலை வெற்றிகரமாக தொடங்கியது',
      workCompleted: 'வேலை வெற்றிகரமாக முடிந்தது',
      reportApproved: 'அறிக்கை வெற்றிகரமாக அங்கீகரிக்கப்பட்டது',
      reportRejected: 'அறிக்கை நிராகரிக்கப்பட்டது',
      scheduleCreated: 'அட்டவணை வெற்றிகரமாக உருவாக்கப்பட்டது',
      supplyOpened: 'நீர் வழங்கல் திறக்கப்பட்டது',
      supplyClosed: 'நீர் வழங்கல் மூடப்பட்டது',
    },
    
    // Chatbot - Tamil
    chatbot: {
      title: 'BlueGrid உதவியாளர்',
      subtitle: 'எப்போதும் உதவ இங்கே',
      placeholder: 'உங்கள் கேள்வியை தட்டச்சு செய்யவும்...',
      askAnything: 'BlueGrid பற்றி எதையும் என்னிடம் கேளுங்கள்!',
      listen: 'கேள்',
      stop: 'நிறுத்து',
      quickQuestions: 'நீங்கள் கேட்கக்கூடிய விரைவான கேள்விகள்:',
      needHelp: 'உதவி தேவையா?',
    },
  },
};
