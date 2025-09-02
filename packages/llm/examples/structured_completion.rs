//! Example demonstrating robust structured LLM completion usage
//!
//! This example shows how to use the improved wavs-llm client for reliable
//! structured responses with proper error handling and retry logic.

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use wavs_llm::{LLMClient, LlmError, LlmOptions, Message};

/// Simple like/dislike response for statement evaluation
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
struct LikeResponse {
    /// Whether the statement is liked (true) or disliked (false)
    like: bool,

    /// Confidence level between 0.0 and 1.0
    #[serde(default)]
    confidence: Option<f32>,
}

/// More complex evaluation response with reasoning
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
struct DetailedEvaluation {
    /// Primary evaluation result
    like: bool,

    /// Confidence score (0.0 to 1.0)
    #[serde(default)]
    confidence: Option<f32>,

    /// Brief explanation of the decision
    #[serde(default)]
    reasoning: Option<String>,

    /// Category tags for the content
    #[serde(default)]
    categories: Vec<String>,
}

/// Sentiment analysis response
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
struct SentimentAnalysis {
    /// Sentiment classification
    sentiment: SentimentType,

    /// Confidence in the classification
    confidence: f32,

    /// Key phrases that influenced the decision
    #[serde(default)]
    key_phrases: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "lowercase")]
enum SentimentType {
    Positive,
    Negative,
    Neutral,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Structured LLM Completion Examples\n");

    // Initialize client with optimized settings for structured output
    let config = LlmOptions::default()
        .with_temperature(0.1) // Low temperature for consistency
        .with_max_tokens(200) // Reasonable limit
        .with_top_p(0.9); // Focused sampling

    let client = LLMClient::with_config("llama3.2", config);

    // Example 1: Basic Like/Dislike Evaluation
    println!("📝 Example 1: Basic Like/Dislike Evaluation");
    basic_like_evaluation(&client)?;

    // Example 2: Detailed Evaluation with Reasoning
    println!("\n📝 Example 2: Detailed Evaluation with Reasoning");
    detailed_evaluation(&client)?;

    // Example 3: Sentiment Analysis
    println!("\n📝 Example 3: Sentiment Analysis");
    sentiment_analysis(&client)?;

    // Example 4: Error Handling and Retry Logic
    println!("\n📝 Example 4: Error Handling and Recovery");
    error_handling_examples(&client)?;

    // Example 5: Batch Processing
    println!("\n📝 Example 5: Batch Processing");
    batch_evaluation(&client)?;

    println!("\n✅ All examples completed successfully!");
    Ok(())
}

fn basic_like_evaluation(client: &LLMClient) -> Result<(), LlmError> {
    let statements = vec![
        "Renewable energy is essential for fighting climate change",
        "Pineapple definitely belongs on pizza",
        "Reading books improves cognitive function and empathy",
    ];

    for statement in statements {
        println!("  Evaluating: {}", statement);

        let prompt = format!(
            "Evaluate this statement and determine if you like it or not: '{}'

            Respond with JSON only containing your like/dislike decision and confidence level.",
            statement
        );

        // Use the new simplified API with structured response
        match client.chat_structured::<LikeResponse>(prompt).send() {
            Ok(response) => {
                println!(
                    "    ✅ Like: {}, Confidence: {:.2}",
                    response.like,
                    response.confidence.unwrap_or(0.0)
                );
            }
            Err(e) => {
                println!("    ❌ Error: {}", e);
                // Continue with next statement instead of failing completely
            }
        }
    }
    Ok(())
}

fn detailed_evaluation(client: &LLMClient) -> Result<(), LlmError> {
    let statement = "Artificial intelligence will revolutionize healthcare by enabling personalized treatments and early disease detection.";

    println!("  Evaluating: {}", statement);

    let system_prompt = "You are an expert evaluator. Analyze statements thoroughly and provide structured feedback with reasoning.";

    let user_prompt = format!(
        "Analyze this statement about AI in healthcare: '{}'

        Provide your evaluation as JSON with like/dislike, confidence, reasoning, and relevant categories.",
        statement
    );

    // Use the new API with system message
    let messages = vec![Message::system(system_prompt), Message::user(user_prompt)];

    match client.chat_structured::<DetailedEvaluation>(messages).send() {
        Ok(response) => {
            println!("    ✅ Detailed Evaluation:");
            println!("       Like: {}", response.like);
            println!("       Confidence: {:.2}", response.confidence.unwrap_or(0.0));
            println!(
                "       Reasoning: {}",
                response.reasoning.unwrap_or_else(|| "No reasoning provided".to_string())
            );
            println!("       Categories: {:?}", response.categories);
        }
        Err(e) => {
            println!("    ❌ Error in detailed evaluation: {}", e);
        }
    }
    Ok(())
}

fn sentiment_analysis(client: &LLMClient) -> Result<(), LlmError> {
    let texts = vec![
        "I absolutely love this new feature! It makes everything so much easier.",
        "This is terrible. Nothing works as expected and the interface is confusing.",
        "The weather today is partly cloudy with temperatures around 72 degrees.",
    ];

    for text in texts {
        println!("  Analyzing: {}", text);

        let prompt = format!(
            "Analyze the sentiment of this text: '{}'

            Classify as positive, negative, or neutral with confidence score and key phrases that influenced your decision.",
            text
        );

        // Use the new API with retry logic
        match client.chat_structured::<SentimentAnalysis>(prompt).with_retries(5).send() {
            Ok(response) => {
                println!(
                    "    ✅ Sentiment: {:?}, Confidence: {:.2}",
                    response.sentiment, response.confidence
                );
                if !response.key_phrases.is_empty() {
                    println!("       Key phrases: {:?}", response.key_phrases);
                }
            }
            Err(e) => {
                println!("    ❌ Sentiment analysis failed: {}", e);
            }
        }
    }
    Ok(())
}

fn error_handling_examples(client: &LLMClient) -> Result<(), LlmError> {
    println!("  Testing error recovery mechanisms...");

    // Test with a prompt that might generate malformed JSON
    let tricky_prompt = "This is a very complex prompt that might cause the model to generate incomplete JSON responses due to length constraints or complexity. Please evaluate this statement and provide a like/dislike response with detailed reasoning that goes on for quite a while to potentially trigger truncation issues.";

    println!("  Attempting potentially problematic request...");

    match client.chat_structured::<LikeResponse>(tricky_prompt).with_retries(3).send() {
        Ok(response) => {
            println!("    ✅ Successfully handled complex prompt");
            println!(
                "       Result: like={}, confidence={:.2}",
                response.like,
                response.confidence.unwrap_or(0.0)
            );
        }
        Err(e) => {
            println!("    ⚠️  Expected error for demonstration: {}", e);

            // Fallback to simpler approach
            println!("  Trying simplified approach...");
            let simple_prompt = "Evaluate this statement briefly: Is it good or bad?";

            match client.chat_structured::<LikeResponse>(simple_prompt).send() {
                Ok(response) => {
                    println!("    ✅ Fallback successful: like={}", response.like);
                }
                Err(e2) => {
                    println!("    ❌ Fallback also failed: {}", e2);
                }
            }
        }
    }

    Ok(())
}

fn batch_evaluation(client: &LLMClient) -> Result<(), LlmError> {
    println!("  Processing multiple statements in batch...");

    let statements = vec![
        "Clean water access is a fundamental human right",
        "Space exploration is worth the investment",
        "Remote work improves work-life balance",
    ];

    // Process each statement individually for better error isolation
    let mut results = Vec::new();

    for (i, statement) in statements.iter().enumerate() {
        println!("  [{}/{}] Processing: {}", i + 1, statements.len(), statement);

        let prompt = format!(
            "Quickly evaluate this statement: '{}'

            Respond with JSON containing like (boolean) and confidence (0.0-1.0).",
            statement
        );

        match client.chat_structured::<LikeResponse>(prompt).send() {
            Ok(response) => {
                results.push((statement, response));
                println!("    ✅ Processed successfully");
            }
            Err(e) => {
                println!("    ❌ Failed to process: {}", e);
                // Continue with next item
            }
        }
    }

    println!("  📊 Batch Results Summary:");
    for (statement, response) in results {
        println!(
            "    {} -> Like: {}, Confidence: {:.2}",
            statement,
            response.like,
            response.confidence.unwrap_or(0.0)
        );
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_schema_generation() {
        use schemars::schema_for;

        // Test that our schemas are properly structured
        let like_schema = schema_for!(LikeResponse);
        assert!(like_schema.schema.object.is_some());

        let detailed_schema = schema_for!(DetailedEvaluation);
        assert!(detailed_schema.schema.object.is_some());

        let sentiment_schema = schema_for!(SentimentAnalysis);
        assert!(sentiment_schema.schema.object.is_some());
    }

    #[test]
    fn test_response_serialization() {
        let response = LikeResponse { like: true, confidence: Some(0.85) };

        let json = serde_json::to_string(&response).unwrap();
        let deserialized: LikeResponse = serde_json::from_str(&json).unwrap();

        assert_eq!(response.like, deserialized.like);
        assert_eq!(response.confidence, deserialized.confidence);
    }

    #[test]
    fn test_detailed_evaluation_defaults() {
        let json = r#"{"like": true}"#;
        let response: DetailedEvaluation = serde_json::from_str(json).unwrap();

        assert_eq!(response.like, true);
        assert_eq!(response.confidence, None);
        assert_eq!(response.reasoning, None);
        assert!(response.categories.is_empty());
    }
}
