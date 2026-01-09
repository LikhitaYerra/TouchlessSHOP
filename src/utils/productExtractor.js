/**
 * Product Attribute Extractor using Free LLM (Hugging Face Inference API)
 * Extracts sizes and colors from product descriptions using AI
 */

/**
 * Extract product attributes using free Hugging Face LLM
 */
export const extractProductAttributes = async (product) => {
  if (!product || !product.description) {
    return { sizes: [], colors: [] };
  }

  try {
    // Try LLM extraction first
    const attributes = await extractWithLLM(product);
    if (attributes && (attributes.sizes.length > 0 || attributes.colors.length > 0)) {
      return attributes;
    }
  } catch (error) {
    console.warn('LLM extraction failed, using pattern matching:', error);
  }

  // Fallback to pattern matching
  return extractWithPatternMatching(product);
};

/**
 * Extract attributes using free Hugging Face LLM API
 * Uses Mistral-7B-Instruct (free, no API key required)
 */
const extractWithLLM = async (product) => {
  const prompt = `Extract product sizes and colors from this product information:

Product Name: ${product.name}
Brand: ${product.brand || 'Unknown'}
Description: ${product.description}
Category: ${product.category || 'general'}

Instructions:
- For shoes: Extract available sizes (typically 6, 7, 8, 9, 10, 11, 12, 13)
- For clothing: Extract sizes (XS, S, M, L, XL, XXL for shirts, or 28, 30, 32, 34, 36, 38, 40 for pants)
- Extract all mentioned colors (Black, White, Blue, Red, Gray, Navy, Brown, Green, etc.)
- If sizes/colors are not mentioned, infer reasonable defaults based on category

Return ONLY a valid JSON object in this exact format (no other text):
{
  "sizes": ["size1", "size2"],
  "colors": ["color1", "color2"]
}`;

  try {
    // Use Hugging Face Inference API - Mistral 7B (free, fast)
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.3,
            return_full_text: false,
          }
        })
      }
    );

    if (!response.ok) {
      // If model is loading, try alternative
      if (response.status === 503) {
        return await extractWithAlternativeLLM(product);
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the response
    let text = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      text = data[0].generated_text;
    } else if (data.generated_text) {
      text = data.generated_text;
    } else if (typeof data === 'string') {
      text = data;
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sizes: Array.isArray(parsed.sizes) ? parsed.sizes.map(s => String(s)) : [],
          colors: Array.isArray(parsed.colors) ? parsed.colors.map(c => String(c)) : []
        };
      } catch (e) {
        console.warn('Failed to parse LLM JSON:', e);
      }
    }
  } catch (error) {
    console.error('LLM extraction error:', error);
    throw error;
  }

  return { sizes: [], colors: [] };
};

/**
 * Alternative LLM using Google Flan-T5 (backup)
 */
const extractWithAlternativeLLM = async (product) => {
  const prompt = `Extract sizes and colors. Product: ${product.name}. Description: ${product.description}. Return JSON: {"sizes": [], "colors": []}`;

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-base',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 100,
            temperature: 0.3,
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const text = data[0]?.generated_text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sizes: Array.isArray(parsed.sizes) ? parsed.sizes.map(s => String(s)) : [],
          colors: Array.isArray(parsed.colors) ? parsed.colors.map(c => String(c)) : []
        };
      }
    }
  } catch (error) {
    console.warn('Alternative LLM failed:', error);
  }

  return { sizes: [], colors: [] };
};

/**
 * Pattern matching extraction (fallback - free and fast)
 */
const extractWithPatternMatching = (product) => {
  const description = (product.description || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const category = product.category || '';
  const fullText = `${name} ${description}`.toLowerCase();

  const sizes = [];
  const colors = [];

  // Size patterns
  const sizePatterns = {
    numeric: /\b([6-9]|1[0-3])\b/g, // 6-13 for shoes
    letter: /\b(xs|s|m|l|xl|xxl|xxxl)\b/gi,
    waist: /\b(2[8-9]|3[0-9]|4[0-2])\b/g // 28-42 for pants
  };

  // Extract numeric sizes
  const numericMatches = [...(fullText.match(sizePatterns.numeric) || [])];
  sizes.push(...numericMatches.map(s => s.toString()));

  // Extract letter sizes
  const letterMatches = [...(fullText.match(sizePatterns.letter) || [])];
  sizes.push(...letterMatches.map(s => s.toUpperCase()));

  // Extract waist sizes for clothing
  if (category === 'clothing' || name.includes('jeans') || name.includes('pants')) {
    const waistMatches = [...(fullText.match(sizePatterns.waist) || [])];
    sizes.push(...waistMatches.map(s => s.toString()));
  }

  // Color extraction with comprehensive color list
  const colorKeywords = {
    'black': ['black', 'ebony', 'charcoal', 'onyx'],
    'white': ['white', 'ivory', 'cream', 'pearl'],
    'blue': ['blue', 'navy', 'azure', 'cobalt', 'sapphire'],
    'red': ['red', 'crimson', 'scarlet', 'maroon', 'burgundy'],
    'gray': ['gray', 'grey', 'silver', 'slate', 'ash'],
    'brown': ['brown', 'tan', 'beige', 'khaki', 'camel', 'taupe'],
    'green': ['green', 'olive', 'emerald', 'mint', 'lime', 'forest'],
    'yellow': ['yellow', 'gold', 'amber', 'mustard'],
    'orange': ['orange', 'tangerine', 'coral', 'peach'],
    'pink': ['pink', 'rose', 'salmon', 'fuchsia'],
    'purple': ['purple', 'violet', 'lavender', 'plum'],
    'teal': ['teal', 'turquoise', 'cyan', 'aqua']
  };

  // Check for color mentions
  Object.entries(colorKeywords).forEach(([color, keywords]) => {
    const found = keywords.some(keyword => fullText.includes(keyword));
    if (found) {
      colors.push(color.charAt(0).toUpperCase() + color.slice(1));
    }
  });

  // Remove duplicates
  const uniqueSizes = [...new Set(sizes)];
  const uniqueColors = [...new Set(colors)];

  // Smart defaults based on category
  if (uniqueSizes.length === 0) {
    if (category === 'shoes') {
      uniqueSizes.push('7', '8', '9', '10', '11');
    } else if (category === 'clothing') {
      if (name.includes('jeans') || name.includes('pants')) {
        uniqueSizes.push('30', '32', '34', '36');
      } else {
        uniqueSizes.push('S', 'M', 'L', 'XL');
      }
    }
  }

  if (uniqueColors.length === 0) {
    uniqueColors.push('Black', 'White');
  }

  return {
    sizes: uniqueSizes.slice(0, 8),
    colors: uniqueColors.slice(0, 6)
  };
};

/**
 * Smart extraction that uses existing data or extracts from description
 */
export const smartExtract = async (product) => {
  // Use existing data if available
  if (product.sizes && product.sizes.length > 0 && 
      product.colors && product.colors.length > 0) {
    return {
      sizes: product.sizes,
      colors: product.colors
    };
  }

  // Try LLM extraction
  try {
    const extracted = await extractProductAttributes({ ...product, category: product.category });
    if (extracted.sizes.length > 0 || extracted.colors.length > 0) {
      return {
        sizes: product.sizes || extracted.sizes,
        colors: product.colors || extracted.colors
      };
    }
  } catch (error) {
    console.warn('Smart extraction failed:', error);
  }

  // Final fallback to pattern matching
  return extractWithPatternMatching({ ...product, category: product.category });
};
