// ==UserScript==
// @name        PUP Survey Helper
// @namespace   Violentmonkey Scripts
// @match       https://survey.pup.edu.ph/apps/ofes/survey/*
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @version     2.0
// @author      intMeinVoid
// @icon        https://www.pup.edu.ph/about/images/PUPLogo.png
// @description Adds a button to help fill out PUP faculty evaluation surveys
// @license     MIT
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        DEFAULT_AVERAGE: 2.5,
        PRESETS: [2.0, 2.5, 3.0, 3.5, 4.0],
        STORAGE_KEY: 'pupSurveyLastUsedRating'
    };


    // Load last used rating
    const lastUsedRating = parseFloat(GM_getValue(CONFIG.STORAGE_KEY, CONFIG.DEFAULT_AVERAGE));

    // Create and style the container
    const container = document.createElement('div');
    container.id = 'pup-survey-helper';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: Arial, sans-serif;
        background: rgba(255, 255, 255, 0.95);
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;

    // Create main button
    const createButton = (text, onClick, isPrimary = false) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            padding: 10px 20px;
            background-color: ${isPrimary ? '#900000' : '#f0f0f0'};
            color: ${isPrimary ? 'white' : '#333'};
            border: 1px solid #ccc;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
            text-align: center;
            min-width: 120px;
        `;
        btn.onmouseenter = () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        };
        btn.onmouseleave = () => {
            btn.style.transform = '';
            btn.style.boxShadow = '';
        };
        btn.onclick = onClick;
        return btn;
    };

    // Create preset buttons
    const presetsContainer = document.createElement('div');
    presetsContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 10px;
        justify-content: center;
    `;

    CONFIG.PRESETS.forEach(preset => {
        const presetBtn = createButton(`Set ${preset}`, () => setEvaluation(preset));
        presetBtn.style.padding = '5px 10px';
        presetBtn.style.minWidth = '40px';
        presetsContainer.appendChild(presetBtn);
    });

    // Create main button
    const mainButton = createButton(`📝 Set Evaluation (${lastUsedRating})`, () => setEvaluation(), true);

    // Add elements to container
    container.appendChild(presetsContainer);
    container.appendChild(mainButton);
    document.body.appendChild(container);

    // Show toast notification
    const showToast = (message, isError = false) => {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: ${isError ? '#ff4444' : '#4CAF50'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            animation: fadeIn 0.3s ease-in-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-in-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Add styles for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);

    // The main evaluation function
    const setEvaluation = async (targetAvg) => {
        try {
            // If no target average provided, prompt user
            if (targetAvg === undefined) {
                const input = prompt('Enter desired average (1-5):', lastUsedRating);
                if (input === null) return; // User clicked cancel
                targetAvg = parseFloat(input);
            }


            // Validate input
            if (isNaN(targetAvg)) {
                throw new Error('Please enter a valid number');
            }

            if (targetAvg < 1 || targetAvg > 5) {
                throw new Error('Target average must be between 1 and 5');
            }


            // Save the rating for next time
            GM_setValue(CONFIG.STORAGE_KEY, targetAvg);
            mainButton.textContent = `📝 Set Evaluation (${targetAvg})`;

            // Get all radio inputs and calculate total questions
            const radios = document.querySelectorAll('input[type="radio"][name^="q"]');
            const totalQuestions = radios.length / 5;

            if (totalQuestions === 0) {
                throw new Error('No questions found on the page');
            }

            // Calculate required values
            const exactTotal = targetAvg * totalQuestions;
            const roundedTotal = Math.round(exactTotal);
            const lowerValue = Math.floor(targetAvg);
            const higherValue = Math.ceil(targetAvg);
            const numberOfHigher = roundedTotal - (lowerValue * totalQuestions);

            // Validate if average is achievable
            if (numberOfHigher < 0 || numberOfHigher > totalQuestions) {
                throw new Error(`Target average ${targetAvg} is not achievable with ${totalQuestions} questions`);
            }

            // Show loading state
            const originalText = mainButton.textContent;
            mainButton.textContent = '⏳ Processing...';
            mainButton.disabled = true;

            // Use requestAnimationFrame to keep UI responsive
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    try {
                        // Clear any previously selected options
                        radios.forEach(radio => radio.checked = false);

                        // Set scores for each question
                        for (let i = 1; i <= totalQuestions; i++) {
                            const score = i <= numberOfHigher ? higherValue : lowerValue;
                            const questionId = `q${i}${score}`;
                            const element = document.getElementById(questionId);

                            if (!element) {
                                throw new Error(`Could not find element with ID: ${questionId}`);
                            }


                            element.checked = true;
                        }


                        // Show success message
                        const msg = `Set ${totalQuestions} questions to average ${targetAvg}\n` +
                                   `(${numberOfHigher} × ${higherValue} and ${totalQuestions - numberOfHigher} × ${lowerValue})`;
                        showToast(msg);
                        resolve();
                    } catch (error) {
                        showToast('Error: ' + error.message, true);
                        resolve();
                    } finally {
                        mainButton.textContent = originalText;
                        mainButton.disabled = false;
                    }
                });
            });

        } catch (error) {
            showToast('Error: ' + error.message, true);
        }
    };

    // Register keyboard shortcut (Ctrl+Shift+E)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            setEvaluation();
        }
    });

    // Add menu command for Tampermonkey
    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand('Set Evaluation', () => setEvaluation());
    }
})();