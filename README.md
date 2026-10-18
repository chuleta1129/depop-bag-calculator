# Depop Bag Calculator

A browser extension that helps you estimate the total cost of items in your Depop bag (before shipping). It uses HTML, CSS, and JavaScript. AI-assisted coding tools were used during development to find solutions, work through bugs, and build features. This project has been a learning experience in working with existing code, troubleshooting issues, and using AI as a development tool.

## Features

- **Scan your bag:** Read visible items from your Depop bag and add them to the calculator.
- **Scan again:** Re-scan your bag after adding, removing, or changing items.
- **Marketplace fee calculation:** Estimates the marketplace fee for each item.
- **Estimated sales tax:** Calculates estimated tax individually for each item.
- **Cost breakdown:** View your item subtotal, marketplace fees, estimated sales tax, and total (before shipping).
- **Simple interface:** A convenient way to estimate your shopping total without manually calculating every item.

## Calculation Formulas

The calculator uses the following estimates for each item, accuracy is not guaranteed:
Note-The Taxes are calculated with a Chicago sales tax, if used from another location it might not be accurate

**Marketplace fee**
Item price × 5% + $0.70

**Estimated sales tax**
(Item price + marketplace fee) × 10.5%

**Estimated total before shipping**
Item price + marketplace fee + estimated sales tax

## Installation (Microsoft Edge)

1. Download or clone this repository.
2. Extract the files if you downloaded a ZIP.
3. Open Microsoft Edge and navigate to `edge://extensions/`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the project folder containing `manifest.json`.
7. Open your Depop bag and use the extension :)

## Technologies

- HTML
- CSS
- JavaScript
- Microsoft Edge Extensions API
