const natural = require('natural');
const compromise = require('compromise');
const fs = require('fs');
const path = require('path');

class NLPService {
    constructor() {
        // Initialize stemmer for word matching
        this.stemmer = natural.PorterStemmer;
        
        // Load inappropriate words from multiple sources
        this.inappropriateWords = this.loadInappropriateWords();
        
        // Enhanced family-friendly replacements
        this.replacementSuggestions = this.loadReplacementSuggestions();
        
        // Context-aware patterns
        this.contextPatterns = this.loadContextPatterns();
    }
      loadInappropriateWords() {
        // Comprehensive list of words that might need replacement
        // Add more categories as needed
        return {
            mild: ['damn', 'hell', 'crap', 'darn', 'shoot'],
            moderate: ['stupid', 'dumb', 'idiot', 'moron', 'jerk'],
            strong: ['hate', 'kill', 'die', 'dead'],
            profanity: ['fuck', 'shit', 'bitch', 'ass', 'asshole', 'bastard', 'piss'],
            slang: ['sucks', 'screwed', 'pissed'],
            inappropriate: ['sexy', 'hot', 'drunk'],
            custom: [] // User can add custom words
        };
    }
    
    loadReplacementSuggestions() {
        return {
            // Mild replacements
            'damn': ['darn', 'dang', 'oh my'],
            'hell': ['heck', 'gosh', 'goodness'],
            'crap': ['crud', 'stuff', 'nonsense'],
            
            // Moderate replacements
            'stupid': ['silly', 'not smart', 'unwise'],
            'dumb': ['silly', 'not clever', 'unwise'],
            'idiot': ['silly person', 'goofball', 'someone not thinking'],
            'moron': ['silly person', 'someone confused'],
            'jerk': ['mean person', 'unkind person'],
              // Strong replacements
            'hate': ['really dislike', 'strongly dislike', 'am not fond of'],
            'kill': ['stop', 'end', 'defeat'],
            'die': ['stop working', 'end', 'break'],
            'dead': ['broken', 'not working', 'finished'],
            
            // Profanity replacements
            'fuck': ['oh no', 'darn', 'shoot'],
            'shit': ['oh no', 'darn', 'crud'],
            'bitch': ['mean person', 'unkind person', 'grumpy person'],
            'ass': ['rear end', 'bottom', 'behind'],
            'asshole': ['mean person', 'jerk', 'unkind person'],
            'bastard': ['mean person', 'jerk', 'troublemaker'],
            'piss': ['annoying', 'frustrating', 'bothering'],
            
            // Slang replacements
            'sucks': ['is not good', 'is disappointing', 'is not great'],
            'screwed': ['in trouble', 'having problems', 'stuck'],
            'pissed': ['angry', 'upset', 'frustrated'],
            
            // Inappropriate replacements
            'sexy': ['attractive', 'good-looking', 'nice'],
            'hot': ['warm', 'attractive', 'popular'],
            'drunk': ['silly', 'not thinking clearly', 'having too much fun']
        };
    }
      loadContextPatterns() {
        return {
            // Patterns to help determine if a word should be replaced based on context
            emphasis: ['really', 'very', 'so', 'totally'],
            negation: ['not', 'never', 'no', "don't", "won't", "can't"],
            intensifiers: ['extremely', 'incredibly', 'absolutely', 'completely']
        };
    }
    
    getAllInappropriateWords() {
        // Flatten all inappropriate word categories into a single array
        const allWords = [];
        
        for (const category in this.inappropriateWords) {
            if (this.inappropriateWords.hasOwnProperty(category) && Array.isArray(this.inappropriateWords[category])) {
                allWords.push(...this.inappropriateWords[category]);
            }
        }
        
        return allWords;
    }
    
    async analyzeText(text, customTargetWords = []) {
        try {
            // Parse text using compromise for better NLP analysis
            const doc = compromise(text);
            
            // Get all words with their parts of speech
            const words = doc.terms().out('array');
            const sentences = doc.sentences().out('array');
            
            // Get all inappropriate words as a flat array
            const allInappropriateWords = this.getAllInappropriateWords();
            
            // Combine inappropriate words with custom target words
            const targetWords = [...allInappropriateWords, ...customTargetWords];
            
            // Find words that need replacement
            const wordsFound = this.findTargetWords(text, targetWords);
            
            // Generate suggestions for replacements
            const suggestions = this.generateReplacements(wordsFound);
            
            // Analyze sentiment to understand context
            const sentiment = this.analyzeSentiment(text);
            
            return {
                originalText: text,
                wordsFound: wordsFound,
                suggestions: suggestions,
                sentiment: sentiment,
                wordCount: words.length,
                sentenceCount: sentences.length,
                analysis: {
                    hasInappropriateContent: wordsFound.length > 0,
                    severity: this.calculateSeverity(wordsFound),
                    recommendations: this.generateRecommendations(wordsFound)
                }
            };
        } catch (error) {
            console.error('NLP analysis error:', error);
            throw new Error('Failed to analyze text');
        }
    }
    
    findTargetWords(text, targetWords) {
        const found = [];
        const words = text.toLowerCase().split(/\s+/);
        
        // Create a map of target words for faster lookup
        const targetWordMap = {};
        targetWords.forEach(word => {
            targetWordMap[word.toLowerCase()] = word;
        });
        
        // Track processed positions to avoid duplicate matches
        const processedPositions = new Set();
        
        words.forEach((word, index) => {
            // Skip if this position has already been processed
            if (processedPositions.has(index)) {
                return;
            }
            
            // Clean word of punctuation
            const cleanWord = word.replace(/[^\w]/g, '');
            
            // Check for exact matches
            if (targetWordMap[cleanWord]) {
                found.push({
                    word: cleanWord,
                    originalWord: word,
                    position: index,
                    targetWord: targetWordMap[cleanWord],
                    context: this.getWordContext(words, index)
                });
                processedPositions.add(index);
                return;
            }
            
            // Check for stemmed matches
            const stemmedWord = this.stemmer.stem(cleanWord);
            for (const target of targetWords) {
                const stemmedTarget = this.stemmer.stem(target.toLowerCase());
                if (stemmedWord === stemmedTarget) {
                    found.push({
                        word: cleanWord,
                        originalWord: word,
                        position: index,
                        targetWord: target,
                        context: this.getWordContext(words, index)
                    });
                    processedPositions.add(index);
                    break;
                }
            }
            
            // Check for multi-word phrases (up to 3 words)
            if (index < words.length - 1) {
                // Check 2-word phrases
                const twoWordPhrase = `${cleanWord} ${words[index + 1].replace(/[^\w]/g, '')}`;
                if (targetWordMap[twoWordPhrase]) {
                    found.push({
                        word: twoWordPhrase,
                        originalWord: `${word} ${words[index + 1]}`,
                        position: index,
                        targetWord: targetWordMap[twoWordPhrase],
                        context: this.getWordContext(words, index, 2)
                    });
                    processedPositions.add(index);
                    processedPositions.add(index + 1);
                    return;
                }
                
                // Check 3-word phrases
                if (index < words.length - 2) {
                    const threeWordPhrase = `${cleanWord} ${words[index + 1].replace(/[^\w]/g, '')} ${words[index + 2].replace(/[^\w]/g, '')}`;
                    if (targetWordMap[threeWordPhrase]) {
                        found.push({
                            word: threeWordPhrase,
                            originalWord: `${word} ${words[index + 1]} ${words[index + 2]}`,
                            position: index,
                            targetWord: targetWordMap[threeWordPhrase],
                            context: this.getWordContext(words, index, 3)
                        });
                        processedPositions.add(index);
                        processedPositions.add(index + 1);
                        processedPositions.add(index + 2);
                        return;
                    }
                }
            }
        });
        
        return found;
    }
    
    generateReplacements(wordsFound) {
        return wordsFound.map(item => {
            const word = item.word.toLowerCase();
            const suggestions = this.replacementSuggestions[word] || ['[BEEP]', '*****'];
            
            return {
                originalWord: item.originalWord,
                word: item.word,
                position: item.position,
                suggestions: suggestions,
                recommended: suggestions[0] || '[BEEP]',
                context: item.context
            };
        });
    }
    
    getWordContext(words, index, phraseLength = 1) {
        const start = Math.max(0, index - 3);
        const end = Math.min(words.length, index + phraseLength + 3);
        
        let context = '';
        for (let i = start; i < end; i++) {
            if (i === index) {
                context += `[${words[i]}] `;
            } else if (i > index && i < index + phraseLength) {
                context += `[${words[i]}] `;
            } else {
                context += `${words[i]} `;
            }
        }
        
        return context.trim();
    }    analyzeSentiment(text) {
        try {
            // Use simple lexicon-based sentiment analysis instead of SentimentAnalyzer
            const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'love', 'like', 'happy', 'best'];
            const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'worst', 'sad', 'angry', 'stupid', 'damn', 'sucks'];
            
            const words = text.toLowerCase().split(/\s+/);
            let positiveCount = 0;
            let negativeCount = 0;
            
            words.forEach(word => {
                const cleanWord = word.replace(/[^\w]/g, '');
                if (positiveWords.includes(cleanWord)) positiveCount++;
                if (negativeWords.includes(cleanWord)) negativeCount++;
            });
            
            const score = (positiveCount - negativeCount) / words.length;
            let sentiment = 'neutral';
            
            if (score > 0.1) sentiment = 'positive';
            else if (score < -0.1) sentiment = 'negative';
            
            return {
                score: score,
                label: sentiment,
                confidence: Math.abs(score),
                positiveWords: positiveCount,
                negativeWords: negativeCount
            };
        } catch (error) {
            console.log('Sentiment analysis error, using fallback:', error.message);
            // Fallback sentiment analysis
            return {
                score: 0,
                label: 'neutral',
                confidence: 0,
                positiveWords: 0,
                negativeWords: 0
            };
        }
    }
    
    calculateSeverity(wordsFound) {
        if (wordsFound.length === 0) return 'none';
        if (wordsFound.length <= 2) return 'low';
        if (wordsFound.length <= 5) return 'medium';
        return 'high';
    }
    
    generateRecommendations(wordsFound) {
        const recommendations = [];
        
        if (wordsFound.length === 0) {
            recommendations.push('No inappropriate content detected. Audio is family-friendly.');
        } else {
            recommendations.push(`Found ${wordsFound.length} word(s) that may need replacement.`);
            recommendations.push('Consider replacing these words with family-friendly alternatives.');
            
            if (wordsFound.length > 5) {
                recommendations.push('High number of replacements needed. Consider reviewing the entire content.');
            }
        }
        
        return recommendations;
    }
      // Method to add custom inappropriate words
    addInappropriateWords(words) {
        if (Array.isArray(words)) {
            this.inappropriateWords.custom.push(...words);
        }
    }
    
    // Method to add custom replacement suggestions
    addReplacementSuggestions(wordReplacements) {
        Object.assign(this.replacementSuggestions, wordReplacements);
    }
}

module.exports = new NLPService();
