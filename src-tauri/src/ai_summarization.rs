use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Serialize, Deserialize)]
pub struct GeminiRequest {
    pub contents: Vec<Content>,
}

#[derive(Serialize, Deserialize)]
pub struct Content {
    pub parts: Vec<Part>,
}

#[derive(Serialize, Deserialize)]
pub struct Part {
    pub text: String,
}

#[derive(Deserialize)]
pub struct GeminiResponse {
    pub candidates: Vec<Candidate>,
}

#[derive(Deserialize)]
pub struct Candidate {
    pub content: ContentResponse,
}

#[derive(Deserialize)]
pub struct ContentResponse {
    pub parts: Vec<PartResponse>,
}

#[derive(Deserialize)]
pub struct PartResponse {
    pub text: String,
}

pub async fn summarize_with_gemini(text: &str) -> Result<String, String> {
    // Load API key from .env
    dotenv::dotenv().ok();
    let api_key = env::var("GEMINI_API_KEY").map_err(|_| "GEMINI_API_KEY not found in .env".to_string())?;

    // Prompt for raw response (no JSON structuring here)
    let prompt = format!(
        "Summarize the following PDF text in a natural, unstructured way. Provide key insights, deadlines, action items, and any relevant details for officials.

        Text: {}",
        text
    );

    let request_body = GeminiRequest {
        contents: vec![Content {
            parts: vec![Part { text: prompt }],
        }],
    };

    // Make API call
    let client = Client::new();
    let url = format!("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}", api_key);
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()));
    }

    // Parse response and return raw text
    let gemini_response: GeminiResponse = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    if let Some(candidate) = gemini_response.candidates.first() {
        if let Some(part) = candidate.content.parts.first() {
            Ok(part.text.clone())  // Return raw text
        } else {
            Err("No text in response".to_string())
        }
    } else {
        Err("No candidates in response".to_string())
    }
}