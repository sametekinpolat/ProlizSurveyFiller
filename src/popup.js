// --- CONFIGURATION ---

// 1. UI Translations
const UI_STRINGS = {
    tr: {
        title: "Otomatik Anket Doldurucu",
        label: "Verilecek Puan/Cevap:",
        button: "Seçili Cevabı Doldur",
        loading: "Seçenekler yükleniyor...",
        status_no_survey: "Anket bulunamadı (Ekranda göründüğünden emin olun).",
        status_success: "Başarılı! {n} soru dolduruldu.",
        status_wait: "Lütfen seçeneklerin yüklenmesini bekleyin.",
        status_ready: "Seçenekler yüklendi. Birini seçin."
    },
    en: {
        title: "Auto Survey Filler",
        label: "Select Rating/Answer:",
        button: "Auto Fill Survey",
        loading: "Loading options...",
        status_no_survey: "No survey found (Ensure it is visible).",
        status_success: "Success! Auto-filled {n} questions.",
        status_wait: "Please wait for options to load.",
        status_ready: "Options loaded. Please select one."
    }
};

// Detect User Language (defaults to English if not Turkish)
const userLang = navigator.language.startsWith('tr') ? 'tr' : 'en';
const TEXT = UI_STRINGS[userLang];

// --- MAIN LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    // A. Localize the Popup Interface
    document.getElementById("uiTitle").innerText = TEXT.title;
    document.getElementById("uiLabel").innerText = TEXT.label;
    document.getElementById("fillBtn").innerText = TEXT.button;
    
    const dropdown = document.getElementById("gradeSelector");
    // Clear any existing options and show loading text
    dropdown.innerHTML = "";
    const loadingOpt = document.createElement("option");
    loadingOpt.innerText = TEXT.loading;
    dropdown.appendChild(loadingOpt);

    // B. Inject Script to find options (inside all frames)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id, allFrames: true }, 
            function: getOptionsFromPage
        }, (results) => {
            // Find the frame that returned a list of options
            const validResult = results.find(frame => frame.result && frame.result.length > 0);

            if (validResult) {
                populateDropdown(validResult.result);
            } else {
                document.getElementById("status").innerText = TEXT.status_no_survey;
            }
        });
    });
});

document.getElementById("fillBtn").addEventListener("click", () => {
    const selectedValue = document.getElementById("gradeSelector").value;
    
    if (!selectedValue || selectedValue === TEXT.loading) {
        document.getElementById("status").innerText = TEXT.status_wait;
        return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id, allFrames: true },
            function: fillSurvey,
            args: [selectedValue], 
        }, (results) => {
             // Check if any frame reported success
             const validResult = results.find(frame => frame.result > 0);
             if (validResult) {
                 document.getElementById("status").innerText = TEXT.status_success.replace("{n}", validResult.result);
             }
        });
    });
});


// --- INJECTED FUNCTIONS (Run inside the Page) ---

function getOptionsFromPage() {
    // 1. Locate the container using the specific ID from your HTML
    const firstContainer = document.querySelector('table[id*="anketRadioList_0"]');
    
    // If this frame doesn't have the survey table, return null
    if (!firstContainer) return null;

    // 2. Scrape the options
    const radios = firstContainer.querySelectorAll('input[type="radio"]');
    let options = [];

    radios.forEach(radio => {
        const label = document.querySelector(`label[for="${radio.id}"]`);
        if (label) {
            options.push({ 
                value: radio.value, 
                text: label.innerText.trim() 
            });
        }
    });

    return options;
}

function fillSurvey(valueToSelect) {
    const selector = `input[type="radio"][value="${valueToSelect}"]`;
    const radios = document.querySelectorAll(selector);
    let count = 0;
    
    radios.forEach((radio) => {
        if (!radio.checked) {
            radio.click();
            count++;
        }
    });
    return count; // Return number of clicked items
}

// --- HELPER (Runs in Popup) ---

function populateDropdown(options) {
    const select = document.getElementById("gradeSelector");
    select.innerHTML = ""; // Clear "Loading..."

    options.forEach((opt, index) => {
        let option = document.createElement("option");
        option.value = opt.value;
        option.innerText = opt.text;
        
        // Optionally select the first item by default
        if(index === 0) option.selected = true;
        
        select.appendChild(option);
    });
    
    document.getElementById("status").innerText = TEXT.status_ready;
}