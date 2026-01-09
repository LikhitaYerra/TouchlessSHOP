#!/bin/bash

# TouchlessShop - Quick Start Script

echo "🛒 TouchlessShop - Starting Application..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Run Streamlit app
echo ""
echo "🚀 Starting Streamlit app..."
echo "📱 Open your browser to the URL shown below"
echo ""
streamlit run app.py

