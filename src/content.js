// config
const UI_TEXT = {
    tr: {
        label: "Otomatik Doldur:",
        btn: "Uygula",
        success: "İşlem Tamam!"
    },
    en: {
        label: "Auto Fill:",
        btn: "Apply",
        success: "Done!"
    }
};

// Detect language
const lang = navigator.language.startsWith('tr') ? 'tr' : 'en';
const TEXT = UI_TEXT[lang];

// check immediately
checkForSurveyAndInject();

function checkForSurveyAndInject() {

    const surveyContainer = document.querySelector('table[id*="anketRadioList_0"]');
    if (!surveyContainer) return; 
    const options = getOptions(surveyContainer);
    if (options.length === 0) return;
    createControlPanel(options);
}

function getOptions(container) {
    const radios = container.querySelectorAll('input[type="radio"]');
    let options = [];
    
    radios.forEach(radio => {
        const label = document.querySelector(`label[for="${radio.id}"]`);
        if (label) {
            options.push({ value: radio.value, text: label.innerText.trim() });
        }
    });
    return options;
}

function createControlPanel(options) {
    // Create the main bar container
    const bar = document.createElement("div");
    bar.style.cssText = `
        position: sticky;
        top: 0;
        z-index: 99999;
        background-color: #f8f9fa;
        border-bottom: 2px solid #007bff;
        padding: 10px 15px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 15px;
        font-family: sans-serif;
    `;

    // Label
    const label = document.createElement("span");
    label.innerText = TEXT.label;
    label.style.fontWeight = "bold";
    label.style.color = "#333";

    // Dropdown
    const select = document.createElement("select");
    select.style.padding = "5px";
    select.style.borderRadius = "4px";
    select.style.border = "1px solid #ccc";
    
    options.forEach((opt, idx) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.innerText = opt.text;
        if(idx === 0) option.selected = true; // Select first by default
        select.appendChild(option);
    });

    // Button
    const btn = document.createElement("button");
    btn.innerText = TEXT.btn;
    btn.style.cssText = `
        background-color: #531e98;
        color: white;
        border: none;
        padding: 6px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    `;
    
    // Status Text
    const status = document.createElement("span");
    status.style.marginLeft = "auto";
    status.style.fontSize = "0.9em";
    status.style.color = "green";

    // Button Click  
    btn.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent form submission if inside a form
        const val = select.value;
        const count = fillSurvey(val);
        
        // Show visual feedback
        status.innerText = `${TEXT.success} (${count})`;
        btn.style.backgroundColor = "#28a745"; // Turn green
        setTimeout(() => {
            status.innerText = "";
            btn.style.backgroundColor = "#531e98"; // Revert color
        }, 2000);
    });

    // Append everything to the bar
    bar.appendChild(label);
    bar.appendChild(select);
    bar.appendChild(btn);
    bar.appendChild(status);

    // Inject the bar to the top of the body
    document.body.prepend(bar);
}

function fillSurvey(valueToSelect) {
    // Find all radios matching the selected value
    const selector = `input[type="radio"][value="${valueToSelect}"]`;
    const radios = document.querySelectorAll(selector);
    let count = 0;
    
    radios.forEach((radio) => {
        if (!radio.checked) {
            radio.click();
            count++;
        }
    });
    return count;
}