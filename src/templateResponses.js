// Template responses as fallback when AI is unavailable

const responseTemplates = {
  KYC_STATUS: {
    en: 'Your KYC verification is currently under review. You can check the status in your mobile app under Profile > KYC Status. Typical processing time is 2-3 working days.',
    hi: 'aapka kyc verification currently under review hai. Aap mobile app mein Profile > KYC Status mein check kar sakte hain. Typical processing time 2-3 working days hai.',
    ta: 'ungal kyc verification currently under review irukku. Neengal mobile app le Profile > KYC Status la check pannalam. Typical processing time 2-3 working days.',
    te: 'mi kyc verification currently under review undi. Me mobile app lo Profile > KYC Status lo check cheyavachu. Typical processing time 2-3 working days.',
    kn: 'nimma kyc verification currently under review ide. Neevu mobile app alli Profile > KYC Status alli check madabahudu. Typical processing time 2-3 working days.'
  },
  
  TRANSACTION_ISSUE: {
    en: 'I understand you\'re having transaction issues. Please check: 1) Sufficient balance 2) Correct beneficiary details 3) Transaction limits. If the issue persists, the transaction will be auto-reversed within 24 hours.',
    hi: 'main samajh gaya ki aapko transaction issues ho rahe hain. Please check: 1) Sufficient balance 2) Correct beneficiary details 3) Transaction limits. Agar issue persist karta hai, to transaction 24 hours mein auto-reverse ho jayega.',
    ta: 'ungalukku transaction issues irukku endru naan purinjitten. Please check: 1) Sufficient balance 2) Correct beneficiary details 3) Transaction limits. Issue continue aana, transaction 24 hours la auto-reverse aagum.',
    te: 'miku transaction issues unnayani naanu ardinchindi. Please check: 1) Sufficient balance 2) Correct beneficiary details 3) Transaction limits. Problem continue ayithe, transaction 24 hours lo auto-reverse avuthundi.',
    kn: 'nimge transaction issues ide endenu nanu tegeduttini. Please check: 1) Sufficient balance 2) Correct beneficiary details 3) Transaction limits. Problem continue aagutare, transaction 24 hoursalli auto-reverse aguvudu.'
  },
  
  ACCOUNT_BALANCE: {
    en: 'Your current account balance is displayed in your mobile app home screen. You can also check by dialing *123# from your registered mobile number or by visiting the nearest ATM.',
    hi: 'aapka current account balance aapke mobile app home screen par display hota hai. Aap *123# dial karke bhi check kar sakte hain ya nearest ATM ja kar bhi.',
    ta: 'ungal current account balance ungal mobile app home screen la show aagum. Neengal *123# number la dial panniyum check pannalam ya nearest ATM po panniyum.',
    te: 'mi current account balance mi mobile app home screen lo kanapadutundi. Me *123# dial chesi kuda check cheskovachu ya nearest ATM velli kuda.',
    kn: 'nimma current account balance nimma mobile app home screen alli kanisuttide. Neenuvu *123# dial madi kuda check madabahudu ya nearest ATM hogi kuda.'
  },
  
  ACCOUNT_INFO: {
    en: 'Your account details are available in the mobile app under Profile section. For complete account statement, you can download it from the app or request it at any branch.',
    hi: 'aapke account details mobile app mein Profile section mein available hain. Complete account statement ke liye, aap ise app se download kar sakte hain ya kisi bhi branch mein request kar sakte hain.',
    ta: 'ungal account details mobile app la Profile section la available irukku. Complete account statement ku, neengal app la download pannalam ya evlo branch la request pannalam.',
    te: 'mi account details mobile app lo Profile section lo available untayi. Complete account statement kosam, me app nundi download cheyavachu ya ee branch lo request cheyavachu.',
    kn: 'nimma account details mobile app alli Profile section alli available ide. Complete account statement ge, neevu app ninda download madabahudu ya yava branch alli request madabahudu.'
  },
  
  CARD_ISSUE: {
    en: 'For card issues: Lost/Stolen - Block immediately via app or call 1800-XXX-XXXX. PIN reset - Use ATM or app. New card - Apply in mobile app under Cards section.',
    hi: 'card issues ke liye: Lost/Stolen - App se immediately block karein ya 1800-XXX-XXXX call karein. PIN reset - ATM ya app use karein. New card - Mobile app mein Cards section mein apply karein.',
    ta: 'card issues ku: Lost/Stolen - app la immediately block pannunga ya 1800-XXX-XXXX call pannunga. PIN reset - ATM ya app use pannunga. New card - mobile app la Cards section la apply pannunga.',
    te: 'card issues kosam: Lost/Stolen - app nundi immediate ga block cheyandi ya 1800-XXX-XXX call cheyandi. PIN reset - ATM ya app use cheyandi. New card - mobile app lo Cards section lo apply cheyandi.',
    kn: 'card issues ge: Lost/Stolen - app ninda immediate block madi ya 1800-XXX-XXXX call madi. PIN reset - ATM ya app use madi. New card - mobile app alli Cards section alli apply madi.'
  },
  
  LOAN_QUERY: {
    en: 'For loan queries: Check EMI due date in mobile app under Loans section. For loan status, visit the branch or call our loan department at 1800-XXX-XXXX.',
    hi: 'loan queries ke liye: Mobile app mein Loans section mein EMI due date check karein. Loan status ke liye branch visit karein ya loan department ko 1800-XXX-XXXX call karein.',
    ta: 'loan queries ku: mobile app la Loans section la EMI due date check pannunga. Loan status ku branch vaanga ya loan department ku 1800-XXX-XXXX call pannunga.',
    te: 'loan queries kosam: mobile app lo Loans section lo EMI due date check cheyandi. Loan status kosam branch vellandi ya loan department ki 1800-XXX-XXXX call cheyandi.',
    kn: 'loan queries ge: mobile app alli Loans section alli EMI due date check madi. Loan status ge branch hogi ya loan department ge 1800-XXX-XXXX call madi.'
  },
  
  NET_BANKING: {
    en: 'For net banking issues: Use "Forgot Password" option on login page. For account lock, wait 30 minutes or call support. Ensure you\'re using updated browser.',
    hi: 'net banking issues ke liye: Login page par "Forgot Password" option use karein. Account lock ke liye, 30 minutes wait karein ya support call karein. Ensure karein ki aap updated browser use kar rahe hain.',
    ta: 'net banking issues ku: login page la "Forgot Password" option use pannunga. Account lock ku, 30 minutes wait pannunga ya support call pannunga. Updated browser use pannungal endru ensure pannunga.',
    te: 'net banking issues kosam: login page lo "Forgot Password" option use cheyandi. Account lock kosam, 30 minutes wait cheyandi ya support call cheyandi. Updated browser use chestunnaru ani cheppandi.',
    kn: 'net banking issues ge: login page alli "Forgot Password" option use madi. Account lock ge, 30 minutes wait madi ya support call madi. Updated browser use maduttiri endu ensure madi.'
  },
  
  MOBILE_APP: {
    en: 'Download our mobile app from Google Play Store or Apple App Store. Search for "Our Bank App". For app issues, try clearing cache or updating to latest version.',
    hi: 'hamara mobile app Google Play Store ya Apple App Store se download karein. "Our Bank App" search karein. App issues ke liye, cache clear karein ya latest version update karein.',
    ta: 'ungal mobile app Google Play Store ya Apple App Store la download pannunga. "Our Bank App" search pannunga. App issues ku, cache clear pannunga ya latest version update pannunga.',
    te: 'mi mobile app Google Play Store ya Apple App Store nundi download cheyandi. "Our Bank App" search cheyandi. App issues kosam, cache clear cheyandi ya latest version update cheyandi.',
    kn: 'nimma mobile app Google Play Store ya Apple App Store ninda download madi. "Our Bank App" search madi. App issues ge, cache clear madi ya latest version update madi.'
  },
  
  BRANCH_INFO: {
    en: 'Find nearest branch using mobile app branch locator or visit our website. Branch hours: 9:30 AM to 4:30 PM (Monday-Friday), 9:30 AM to 1:30 PM (Saturday).',
    hi: 'nearest branch find karne ke liye mobile app branch locator use karein ya hamara website visit karein. Branch hours: 9:30 AM se 4:30 PM (Monday-Friday), 9:30 AM se 1:30 PM (Saturday).',
    ta: 'nearest branch find pannathukku mobile app branch locator use pannunga ya yal website visit pannunga. Branch hours: 9:30 AM to 4:30 PM (Monday-Friday), 9:30 AM to 1:30 PM (Saturday).',
    te: 'nearest branch thesukodaniki mobile app branch locator use cheyandi ya memu website visit cheyandi. Branch hours: 9:30 AM to 4:30 PM (Monday-Friday), 9:30 AM to 1:30 PM (Saturday).',
    kn: 'nearest branch find madabahude mobile app branch locator use madi ya namma website visit madi. Branch hours: 9:30 AM to 4:30 PM (Monday-Friday), 9:30 AM to 1:30 PM (Saturday).'
  },
  
  GENERAL_GREETING: {
    en: 'Hello! I\'m your virtual banking assistant. How can I help you today? You can ask about KYC status, transactions, account balance, or any banking related queries.',
    hi: 'Namaste! Main aapka virtual banking assistant hun. Main aapki aaj kya madad kar sakta hun? Aap KYC status, transactions, account balance, ya kisi bhi banking related queries ke baare mein poochh sakte hain.',
    ta: 'Vanakkam! Naan ungal virtual banking assistant. Naan ungalukku ippa eppadi help seivathu? Neengal KYC status, transactions, account balance, ya etho banking related queries pathi kelungal.',
    te: 'Namaskaram! Nemi mi virtual banking assistant. Nemi mi ipudu ela help cheyagalanu? Me KYC status, transactions, account balance, ya e banking related queries gurinchi adagavachu.',
    kn: 'Namaskara! Naanu nimma virtual banking assistant. Naanu nimmage elli hege help madabahudu? Neevu KYC status, transactions, account balance, ya banking related queries barege helabahudu.'
  },
  
  COMPLAINT: {
    en: 'I understand your concern. To file a formal complaint, please use the complaint section in mobile app or call our customer care at 1800-XXX-XXXX. Your complaint number will be shared within 24 hours.',
    hi: 'main samajh gaya ki aapka concern hai. Formal complaint file karne ke liye, mobile app mein complaint section use karein ya hamare customer care ko 1800-XXX-XXXX call karein. Aapka complaint number 24 hours ke andar share kar diya jayega.',
    ta: 'ungal concern endru naan purinjitten. Formal complaint file pannathukku, mobile app la complaint section use pannunga ya yal customer care ku 1800-XXX-XXXX call pannunga. Ungal complaint number 24 hours la share pannappadum.',
    te: 'mi concern ani naanu ardinchindi. Formal complaint file cheyadaniki, mobile app lo complaint section use cheyandi ya memu customer care ki 1800-XXX-XXXX call cheyandi. Mi complaint number 24 hours lo share chestundi.',
    kn: 'nimma concern endenu nanu tegeduttini. Formal complaint file madabahudke, mobile app alli complaint section use madi ya namma customer care ge 1800-XXX-XXXX call madi. Nimma complaint number 24 hoursalli share aguvudu.'
  },
  
  BLOCK_ACCOUNT: {
    en: 'For immediate account blocking, please call our 24/7 helpline at 1800-XXX-XXXX or visit the nearest branch with your ID proof. This is a high-priority security matter.',
    hi: 'immediate account blocking ke liye, kripya hamare 24/7 heleline 1800-XXX-XXXX call karein ya nearest branch visit karein aapke ID proof ke saath. Ye ek high-priority security matter hai.',
    ta: 'immediate account blocking ku, please yal 24/7 helpline 1800-XXX-XXXX call pannunga ya nearest branch visit pannunga ungal ID proof oda. Idhu oru high-priority security matter.',
    te: 'immediate account blocking kosam, dayachesi memu 24/7 helpline 1800-XXX-XXX call cheyandi ya nearest branch visit cheyandi mi ID proof tho. Idi high-priority security matter.',
    kn: 'immediate account blocking ge, dayavittu namma 24/7 helpline 1800-XXX-XXXX call madi ya nearest branch visit madi nimma ID proofinda. Ivi high-priority security matter.'
  },
  
  UNKNOWN: {
    en: 'I didn\'t quite understand that. Could you please rephrase your query? You can ask about KYC status, transactions, account balance, card issues, or loan information.',
    hi: 'main samajh nahi paya. Kripya apni query dohraane ki kshama karein. Aap KYC status, transactions, account balance, card issues, ya loan information ke baare mein poochh sakte hain.',
    ta: 'naan purila. Please ungal query marupadiyum kelungal. Neengal KYC status, transactions, account balance, card issues, ya loan information pathi kelungal.',
    te: 'naaku ardinchaledu. Mi query ni marchi adagandi. Me KYC status, transactions, account balance, card issues, ya loan information gurinchi adagavachu.',
    kn: 'nanu tegedilla. Nimma query nannu marali helabahudu. Neevu KYC status, transactions, account balance, card issues, ya loan information barege helabahudu.'
  }
};

function generateResponse(intent, language, escalated = false) {
  const responseKey = intent || 'UNKNOWN';
  const langCode = language || 'en';
  
  let response = responseTemplates[responseKey]?.[langCode] || 
                 responseTemplates[responseKey]?.['en'] || 
                 responseTemplates['UNKNOWN'][langCode];
  
  // Add escalation note if needed
  if (escalated) {
    const escalationNote = ' I\'m connecting you to a human agent for better assistance.';
    response += escalationNote;
  }
  
  return response;
}

module.exports = { generateResponse, responseTemplates };
