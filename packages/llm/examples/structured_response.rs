//! Example demonstrating structured response support with Ollama
//!
//! This example shows how to use the structured output features of the LLM client
//! to get responses in specific JSON formats.

use llm::client::{LLMClient, Message, ResponseFormat};
use llm::errors::LlmError;
use serde::{Deserialize, Serialize};
use serde_json::json;

/// Example struct for a person's information
#[derive(Debug, Serialize, Deserialize)]
struct Person {
    name: String,
    age: u32,
    occupation: String,
    city: String,
}

/// Example struct for a task list
#[derive(Debug, Serialize, Deserialize)]
struct TaskList {
    title: String,
    tasks: Vec<Task>,
    priority: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Task {
    id: u32,
    description: String,
    completed: bool,
}

/// Example struct for sentiment analysis
#[derive(Debug, Serialize, Deserialize)]
struct SentimentAnalysis {
    text: String,
    sentiment: String,
    confidence: f32,
    keywords: Vec<String>,
}

fn main() -> Result<(), LlmError> {
    // Initialize the LLM client
    let client = LLMClient::new("llama2".to_string());

    // Example 1: Simple JSON mode
    println!("Example 1: JSON Mode");
    println!("====================");
    example_json_mode(&client)?;
    println!();

    // Example 2: Structured output with schema
    println!("Example 2: Schema-based Structured Output");
    println!("=========================================");
    example_schema_output(&client)?;
    println!();

    // Example 3: Complex nested structure
    println!("Example 3: Complex Nested Structure");
    println!("===================================");
    example_complex_structure(&client)?;
    println!();

    // Example 4: Sentiment analysis with structured output
    println!("Example 4: Sentiment Analysis");
    println!("=============================");
    example_sentiment_analysis(&client)?;

    Ok(())
}

/// Example using simple JSON mode
fn example_json_mode(client: &LLMClient) -> Result<(), LlmError> {
    let messages = vec![
        Message::new_system("You are a helpful assistant that always responds in valid JSON format.".to_string()),
        Message::new_user(
            "List three programming languages with their main use cases. \
             Format as JSON with 'languages' array containing objects with 'name' and 'use_case' fields."
                .to_string(),
        ),
    ];

    // Use JSON mode to ensure valid JSON output
    let format = Some(ResponseFormat::json());

    let response = client.chat_completion_with_format(messages, None, format)?;

    if let Some(content) = response.content {
        println!("Raw JSON response:");
        println!("{}", content);

        // Parse and pretty-print the JSON
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&content) {
            println!("\nParsed and formatted:");
            println!("{}", serde_json::to_string_pretty(&parsed).unwrap());
        }
    }

    Ok(())
}

/// Example using schema-based structured output
fn example_schema_output(client: &LLMClient) -> Result<(), LlmError> {
    // Define a JSON schema for the expected output
    let person_schema = json!({
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "The person's full name"
            },
            "age": {
                "type": "integer",
                "description": "The person's age in years",
                "minimum": 0,
                "maximum": 150
            },
            "occupation": {
                "type": "string",
                "description": "The person's job or profession"
            },
            "city": {
                "type": "string",
                "description": "The city where the person lives"
            }
        },
        "required": ["name", "age", "occupation", "city"]
    });

    let messages = vec![Message::new_user(
        "Generate information about a fictional software engineer named John Doe \
             who is 28 years old and lives in San Francisco."
            .to_string(),
    )];

    // Use the structured response method with type inference
    let person: Person = client.chat_completion_structured(messages, None, person_schema)?;

    println!("Structured Person Response:");
    println!("  Name: {}", person.name);
    println!("  Age: {}", person.age);
    println!("  Occupation: {}", person.occupation);
    println!("  City: {}", person.city);

    Ok(())
}

/// Example with complex nested structures
fn example_complex_structure(client: &LLMClient) -> Result<(), LlmError> {
    let task_schema = json!({
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "The title of the task list"
            },
            "tasks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "integer",
                            "description": "Unique task identifier"
                        },
                        "description": {
                            "type": "string",
                            "description": "Description of the task"
                        },
                        "completed": {
                            "type": "boolean",
                            "description": "Whether the task is completed"
                        }
                    },
                    "required": ["id", "description", "completed"]
                }
            },
            "priority": {
                "type": "string",
                "enum": ["low", "medium", "high"],
                "description": "Overall priority of the task list"
            }
        },
        "required": ["title", "tasks", "priority"]
    });

    let messages = vec![Message::new_user(
        "Create a task list for building a web application. \
             Include 3 tasks with IDs, descriptions, and completion status. \
             Set the priority to high."
            .to_string(),
    )];

    let task_list: TaskList = client.chat_completion_structured(messages, None, task_schema)?;

    println!("Task List: {}", task_list.title);
    println!("Priority: {}", task_list.priority);
    println!("Tasks:");
    for task in &task_list.tasks {
        let status = if task.completed { "✓" } else { "○" };
        println!("  {} [{}] {}", status, task.id, task.description);
    }

    Ok(())
}

/// Example of sentiment analysis with structured output
fn example_sentiment_analysis(client: &LLMClient) -> Result<(), LlmError> {
    let sentiment_schema = json!({
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": "The analyzed text"
            },
            "sentiment": {
                "type": "string",
                "enum": ["positive", "negative", "neutral", "mixed"],
                "description": "The overall sentiment"
            },
            "confidence": {
                "type": "number",
                "minimum": 0.0,
                "maximum": 1.0,
                "description": "Confidence score between 0 and 1"
            },
            "keywords": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "Key words that influenced the sentiment"
            }
        },
        "required": ["text", "sentiment", "confidence", "keywords"]
    });

    let text_to_analyze = "The new product launch was incredibly successful! \
                          Customers love the innovative features and the support team has been amazing.";

    let messages = vec![
        Message::new_system("You are a sentiment analysis expert.".to_string()),
        Message::new_user(format!(
            "Analyze the sentiment of the following text: \"{}\"",
            text_to_analyze
        )),
    ];

    let analysis: SentimentAnalysis =
        client.chat_completion_structured(messages, None, sentiment_schema)?;

    println!("Sentiment Analysis Results:");
    println!("  Text: \"{}...\"", &analysis.text[..50.min(analysis.text.len())]);
    println!("  Sentiment: {}", analysis.sentiment);
    println!("  Confidence: {:.2}%", analysis.confidence * 100.0);
    println!("  Keywords: {}", analysis.keywords.join(", "));

    Ok(())
}

/// Example showing error handling for structured responses
#[allow(dead_code)]
fn example_error_handling(client: &LLMClient) -> Result<(), LlmError> {
    let schema = json!({
        "type": "object",
        "properties": {
            "value": {
                "type": "integer",
                "minimum": 1,
                "maximum": 10
            }
        },
        "required": ["value"]
    });

    let messages = vec![Message::new_user("Generate a random number.".to_string())];

    // Attempt to parse the response
    match client.chat_completion_structured::<serde_json::Value>(messages, None, schema) {
        Ok(value) => {
            println!("Successfully parsed: {:?}", value);
        }
        Err(LlmError::ParseError(e)) => {
            println!("Failed to parse structured response: {}", e);
            println!("The model might not have followed the schema strictly.");
        }
        Err(e) => {
            println!("Other error occurred: {}", e);
        }
    }

    Ok(())
}
