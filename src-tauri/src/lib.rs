mod ai_summarization;

use serde::{Deserialize, Serialize};
use pdf_extract::extract_text;
pub mod local_summarizer;
use ai_summarization::summarize_with_gemini;

#[derive(Serialize, Deserialize)]
pub struct Summary {
    pub short_summary: String,
    pub relevance_to_officials: Vec<String>,
    pub action_items: Vec<String>,
    pub confidence_estimate: String,
    pub raw_text: String,
}

#[tauri::command]
async fn summarize_local(file_path: String) -> Result<Summary, String> {
    let text = tokio::task::spawn_blocking(move || {
        extract_text(&file_path)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
    .map_err(|e| format!("Failed to extract text: {}", e))?;

    if text.is_empty() {
        return Err("No text extracted from PDF".to_string());
    }

    // Use your local summarizer module
    let local_summary = local_summarizer::summarize_text_local(&text, 5)
        .ok_or("Failed to generate local summary".to_string())?;

    Ok(Summary {
        short_summary: local_summary.short_summary,
        relevance_to_officials: local_summary.relevance_to_officials,
        action_items: local_summary.action_items,
        confidence_estimate: local_summary.confidence_estimate,
        raw_text: text,
    })
}

#[tauri::command]
async fn summarize_ai(file_path: String) -> Result<Summary, String> {
    let text = tokio::task::spawn_blocking(move || {
        extract_text(&file_path)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
    .map_err(|e| format!("Failed to extract text: {}", e))?;

    if text.is_empty() {
        return Err("No text extracted from PDF".to_string());
    }

    // Get raw LLM response
    let raw_llm_response = summarize_with_gemini(&text).await?;

    // Return raw response in Summary (frontend will structure it)
    Ok(Summary {
        short_summary: raw_llm_response,  // Raw text here
        relevance_to_officials: vec![],  // Empty for now
        action_items: vec![],
        confidence_estimate: "".to_string(),
        raw_text: text,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![summarize_local, summarize_ai])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
