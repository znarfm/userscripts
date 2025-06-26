// ==UserScript==
// @name        PUP Survey Helper
// @namespace   Violentmonkey Scripts
// @match       https://survey.pup.edu.ph/apps/ofes/survey/*
// @grant       none
// @version     1.2
// @author      intMeinVoid
// @icon        https://www.pup.edu.ph/about/images/PUPLogo.png
// @description Adds a button to help fill out PUP faculty evaluation surveys
// @license     MIT
// ==/UserScript==
 
(function() {
    'use strict';
 
    // Create and style the floating button
    const button = document.createElement('button');
    button.textContent = '📝 Set Eval';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background-color: #900000;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
 
    // Add hover effect
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#b00000';
    });
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = '#900000';
    });
 
    // Add the evaluation function
    const setEvaluation = async (targetAvg) => {
        try {
            // If no target average provided, prompt user
            if (targetAvg === undefined) {
                const input = prompt('Enter desired average (1-5):', '2.5');
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
            alert(msg);
 
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };
 
    // Add click handler to the button
    button.addEventListener('click', () => setEvaluation());
 
    // Add the button to the page
    document.body.appendChild(button);
})();