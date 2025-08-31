//! Example demonstrating structured response support with Ollama
//!
//! This example shows how to use the structured output features of the LLM client
//! to get responses in specific JSON formats.

use serde::{Deserialize, Serialize};
use wavs_llm::{LLMClient, LlmError, Message};

/// Example struct for a person's information
#[derive(Debug, Serialize, Deserialize, schemars::JsonSchema)]
struct Person {
    name: String,
    age: u32,
    occupation: String,
    city: String,
}

/// Example struct for a task list
#[derive(Debug, Serialize, Deserialize, schemars::JsonSchema)]
struct TaskList {
    title: String,
    tasks: Vec<Task>,
    priority: String,
}

#[derive(Debug, Serialize, Deserialize, schemars::JsonSchema)]
struct Task {
    id: u32,
    description: String,
    completed: bool,
}

/// Example struct for sentiment analysis
#[derive(Debug, Serialize, Deserialize, schemars::JsonSchema)]
struct SentimentAnalysis {
    text: String,
    sentiment: String,
    confidence: f32,
    keywords: Vec<String>,
}

fn main() -> Result<(), LlmError> {
    // Initialize the LLM client
    let client = LLMClient::new("llama3.2");

    // Example 1: Simple text completion
    println!("Example 1: Simple Text Completion");
    println!("==================================");
    example_simple_completion(&client)?;
    println!();

    // Example 2: Structured output with automatic schema
    println!("Example 2: Automatic Structured Output");
    println!("======================================");
    example_structured_output(&client)?;
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

/// Example using simple text completion
fn example_simple_completion(client: &LLMClient) -> Result<(), LlmError> {
    // Simple completion using the new API
    let response = client.chat("What is the capital of France?").text()?;
    println!("Simple completion: {}", response);

    // Completion with system context using the new Message builders
    let messages = vec![
        Message::system("You are a helpful geography expert"),
        Message::user("What are the three largest cities in Japan?"),
    ];
    let response = client.chat(messages).text()?;
    println!("\nWith system context: {}", response);

    Ok(())
}

/// Example using automatic structured output
fn example_structured_output(client: &LLMClient) -> Result<(), LlmError> {
    // The schema is automatically generated from the type!
    let person: Person = client
        .chat_structured("Generate information about a fictional software engineer named John Doe who is 28 years old and lives in San Francisco.")
        .send()?;

    println!("Structured Person Response:");
    println!("  Name: {}", person.name);
    println!("  Age: {}", person.age);
    println!("  Occupation: {}", person.occupation);
    println!("  City: {}", person.city);

    // With system context using Message builders
    let messages = vec![
        Message::system("You are a creative writer who creates realistic character profiles"),
        Message::user("Create a profile for a data scientist living in London"),
    ];
    let person_with_context: Person = client.chat_structured(messages).send()?;

    println!("\nWith System Context:");
    println!("  Name: {}", person_with_context.name);
    println!("  Age: {}", person_with_context.age);
    println!("  Occupation: {}", person_with_context.occupation);
    println!("  City: {}", person_with_context.city);

    Ok(())
}

/// Example with complex nested structures
fn example_complex_structure(client: &LLMClient) -> Result<(), LlmError> {
    // The schema is automatically inferred from the TaskList type
    let task_list: TaskList = client
        .chat_structured(
            "Create a task list for building a web application. \
             Include 3 tasks with IDs, descriptions, and completion status. \
             Set the priority to high.",
        )
        .send()?;

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
    let text_to_analyze = "The new product launch was incredibly successful! \
                          Customers love the innovative features and the support team has been amazing.";

    // Using the new API with system and user messages
    let messages = vec![
        Message::system("You are a sentiment analysis expert."),
        Message::user(format!(
            "Analyze the sentiment of the following text: \"{}\"",
            text_to_analyze
        )),
    ];

    // Simple and clean - just specify the type!
    let analysis: SentimentAnalysis = client.chat_structured(messages).send()?;

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
    #[derive(Debug, Deserialize, schemars::JsonSchema)]
    struct NumberResponse {
        value: i32,
    }

    // Attempt to parse the response with retry logic using the new API
    match client
        .chat_structured::<NumberResponse>("Generate a random number between 1 and 10")
        .with_retries(3)
        .send()
    {
        Ok(response) => {
            println!("Successfully parsed: {:?}", response.value);
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
