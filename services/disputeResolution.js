const fs = require('fs').promises;
const path = require('path');
const { fromBuffer } = require('file-type');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const ColorThief = require('colorthief');
const imageHash = require('imghash');

/**
 * Validates file formats and resolution requirements for logo deliverables
 * @param {Array} deliverables - Array of file paths to validate
 * @param {Array} requiredFormats - Array of required file formats (e.g., ['png', 'jpg', 'svg'])
 * @returns {Object} Validation result with status and details
 */
async function validateFileFormats(deliverables, requiredFormats) {
  const results = {
    valid: true,
    errors: [],
    details: []
  };

  try {
    for (const filePath of deliverables) {
      const fileBuffer = await fs.readFile(filePath);
      const fileType = await fromBuffer(fileBuffer);
      
      if (!fileType) {
        results.valid = false;
        results.errors.push(`Unable to determine file type for ${path.basename(filePath)}`);
        continue;
      }

      // Check if file format is in required formats
      if (!requiredFormats.includes(fileType.ext)) {
        results.valid = false;
        results.errors.push(`File ${path.basename(filePath)} has format ${fileType.ext}, but required formats are: ${requiredFormats.join(', ')}`);
        continue;
      }

      // Check resolution for image files (skip SVG as it's vector)
      if (['png', 'jpg', 'jpeg'].includes(fileType.ext)) {
        try {
          const metadata = await sharp(fileBuffer).metadata();
          const minResolution = 1080;
          
          if (metadata.width < minResolution || metadata.height < minResolution) {
            results.valid = false;
            results.errors.push(`File ${path.basename(filePath)} has resolution ${metadata.width}x${metadata.height}, minimum required is ${minResolution}x${minResolution}`);
          } else {
            results.details.push(`File ${path.basename(filePath)} passed validation: ${fileType.ext} format, ${metadata.width}x${metadata.height} resolution`);
          }
        } catch (sharpError) {
          results.valid = false;
          results.errors.push(`Unable to read image metadata for ${path.basename(filePath)}: ${sharpError.message}`);
        }
      } else {
        results.details.push(`File ${path.basename(filePath)} passed format validation: ${fileType.ext}`);
      }
    }
  } catch (error) {
    results.valid = false;
    results.errors.push(`File validation error: ${error.message}`);
  }

  return results;
}

/**
 * Uses OCR to check if expected text is present in the logo
 * @param {string} imagePath - Path to the logo image file
 * @param {string} expectedText - Text that should be present in the logo
 * @returns {Object} OCR result with found status and confidence
 */
async function checkTextInLogo(imagePath, expectedText) {
  const result = {
    found: false,
    confidence: 0,
    extractedText: '',
    error: null
  };

  try {
    const { data: { text, confidence } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => console.log(m) // Optional: log OCR progress
    });

    result.extractedText = text.trim();
    result.confidence = confidence;

    // Check if expected text is found (case-insensitive)
    const normalizedExtracted = text.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedExpected = expectedText.toLowerCase().replace(/\s+/g, ' ').trim();
    
    result.found = normalizedExtracted.includes(normalizedExpected);

  } catch (error) {
    result.error = `OCR processing failed: ${error.message}`;
  }

  return result;
}

/**
 * Extracts and compares color palette from logo with expected colors
 * @param {string} imagePath - Path to the logo image file
 * @param {Array} expectedColors - Array of expected RGB color arrays [[r,g,b], [r,g,b]]
 * @returns {Object} Color comparison result
 */
async function checkColorPalette(imagePath, expectedColors) {
  const result = {
    matches: false,
    extractedColors: [],
    matchedColors: [],
    tolerance: 20, // 20% tolerance for color matching
    error: null
  };

  try {
    // Extract dominant colors from the image
    const dominantColors = await ColorThief.getPalette(imagePath, 8);
    result.extractedColors = dominantColors;

    // Check if expected colors are present within tolerance
    for (const expectedColor of expectedColors) {
      let colorFound = false;
      
      for (const extractedColor of dominantColors) {
        const colorDistance = Math.sqrt(
          Math.pow(expectedColor[0] - extractedColor[0], 2) +
          Math.pow(expectedColor[1] - extractedColor[1], 2) +
          Math.pow(expectedColor[2] - extractedColor[2], 2)
        );
        
        // Calculate percentage difference (max possible distance is ~441 for RGB)
        const toleranceThreshold = (result.tolerance / 100) * 441;
        
        if (colorDistance <= toleranceThreshold) {
          colorFound = true;
          result.matchedColors.push({
            expected: expectedColor,
            found: extractedColor,
            distance: colorDistance
          });
          break;
        }
      }
      
      if (!colorFound) {
        result.matches = false;
        return result;
      }
    }
    
    result.matches = true;

  } catch (error) {
    result.error = `Color extraction failed: ${error.message}`;
  }

  return result;
}

/**
 * Generates perceptual hash for originality checking
 * @param {string} imagePath - Path to the logo image file
 * @returns {Object} Originality check result with hash and mock reverse search
 */
async function checkOriginality(imagePath) {
  const result = {
    isOriginal: true,
    hash: null,
    similarImages: [],
    confidence: 0,
    error: null
  };

  try {
    // Generate perceptual hash
    const hash = await imageHash.hash(imagePath, 16, 'hex');
    result.hash = hash;

    // Mock reverse image search (placeholder for future TinEye/Google Vision integration)
    // In production, this would make actual API calls to reverse image search services
    const mockSimilarImages = await mockReverseImageSearch(hash);
    result.similarImages = mockSimilarImages;

    // Determine originality based on similarity threshold
    const highSimilarityThreshold = 0.85;
    const hasHighSimilarity = mockSimilarImages.some(img => img.similarity > highSimilarityThreshold);
    
    result.isOriginal = !hasHighSimilarity;
    result.confidence = hasHighSimilarity ? 
      Math.max(...mockSimilarImages.map(img => img.similarity)) : 
      0.1; // Low confidence indicates likely original

  } catch (error) {
    result.error = `Originality check failed: ${error.message}`;
  }

  return result;
}

/**
 * Mock function for reverse image search (placeholder for actual API integration)
 * @param {string} hash - Perceptual hash of the image
 * @returns {Array} Mock array of similar images
 */
async function mockReverseImageSearch(hash) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock response - in production, this would be actual API results
  const mockResults = [
    {
      url: 'https://example.com/similar1.jpg',
      similarity: 0.15,
      source: 'Mock Database'
    },
    {
      url: 'https://example.com/similar2.jpg', 
      similarity: 0.08,
      source: 'Mock Database'
    }
  ];

  return mockResults;
}

/**
 * Main dispute resolution function that orchestrates all validation checks
 * @param {Object} scopeboxInputs - Original order requirements from scopebox
 * @param {Array} deliverables - Array of delivered file paths
 * @returns {Object} Dispute resolution decision
 */
async function resolveDispute(scopeboxInputs, deliverables) {
  const resolution = {
    status: 'escalate', // Default to escalation
    reasons: [],
    nextStep: 'escalateToArbitrator',
    validationResults: {},
    autoResolutionConfidence: 0
  };

  try {
    // Extract requirements from scopebox inputs
    const requirements = {
      fileFormats: scopeboxInputs.logoDesignSpecific?.fileFormats || ['png', 'jpg', 'svg'],
      logoText: scopeboxInputs.logoDesignSpecific?.logoText || '',
      colorPalette: scopeboxInputs.logoDesignSpecific?.colorPalette || [],
      originalityRequired: scopeboxInputs.logoDesignSpecific?.originalityRequired !== false
    };

    // 1. Validate file formats and resolution
    console.log('Running file format validation...');
    const formatValidation = await validateFileFormats(deliverables, requirements.fileFormats);
    resolution.validationResults.formatValidation = formatValidation;

    if (!formatValidation.valid) {
      resolution.reasons.push(...formatValidation.errors);
    }

    // 2. Check text in logo (if text is required)
    if (requirements.logoText && requirements.logoText.trim() !== '') {
      console.log('Running text validation...');
      const textResults = [];
      
      for (const filePath of deliverables) {
        const textCheck = await checkTextInLogo(filePath, requirements.logoText);
        textResults.push({ file: path.basename(filePath), ...textCheck });
      }
      
      resolution.validationResults.textValidation = textResults;
      
      const textFound = textResults.some(result => result.found);
      if (!textFound) {
        resolution.reasons.push(`Required text "${requirements.logoText}" not found in any logo files`);
      }
    }

    // 3. Check color palette (if colors are specified)
    if (requirements.colorPalette && requirements.colorPalette.length > 0) {
      console.log('Running color palette validation...');
      const colorResults = [];
      
      for (const filePath of deliverables) {
        const colorCheck = await checkColorPalette(filePath, requirements.colorPalette);
        colorResults.push({ file: path.basename(filePath), ...colorCheck });
      }
      
      resolution.validationResults.colorValidation = colorResults;
      
      const colorsMatch = colorResults.some(result => result.matches);
      if (!colorsMatch) {
        resolution.reasons.push('Required color palette not found in logo designs');
      }
    }

    // 4. Check originality (if required)
    if (requirements.originalityRequired) {
      console.log('Running originality check...');
      const originalityResults = [];
      
      for (const filePath of deliverables) {
        const originalityCheck = await checkOriginality(filePath);
        originalityResults.push({ file: path.basename(filePath), ...originalityCheck });
      }
      
      resolution.validationResults.originalityValidation = originalityResults;
      
      const isOriginal = originalityResults.every(result => result.isOriginal);
      if (!isOriginal) {
        resolution.reasons.push('Logo designs appear to be non-original or copied');
      }
    }

    // 5. Make resolution decision based on validation results
    const hasErrors = resolution.reasons.length > 0;
    const criticalErrors = resolution.reasons.filter(reason => 
      reason.includes('format') || 
      reason.includes('resolution') || 
      reason.includes('non-original')
    ).length > 0;

    if (!hasErrors) {
      // All validations passed - auto approve
      resolution.status = 'auto_approve';
      resolution.nextStep = 'releaseFunds';
      resolution.autoResolutionConfidence = 0.95;
    } else if (criticalErrors) {
      // Critical issues found - auto refund
      resolution.status = 'auto_refund';
      resolution.nextStep = 'refundBuyer';
      resolution.autoResolutionConfidence = 0.85;
    } else {
      // Minor issues - escalate to human arbitrator
      resolution.status = 'escalate';
      resolution.nextStep = 'escalateToArbitrator';
      resolution.autoResolutionConfidence = 0.3;
    }

  } catch (error) {
    resolution.reasons.push(`Dispute resolution error: ${error.message}`);
    resolution.status = 'escalate';
    resolution.nextStep = 'escalateToArbitrator';
  }

  return resolution;
}

module.exports = {
  validateFileFormats,
  checkTextInLogo,
  checkColorPalette,
  checkOriginality,
  resolveDispute
};
