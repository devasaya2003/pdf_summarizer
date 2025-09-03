use pdf_extract::extract_text;
use serde::{Deserialize, Serialize};
use tokio::time::{sleep, Duration};
pub mod local_summarizer;

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

    // Simulate API call with 3-second timeout
    sleep(Duration::from_secs(3)).await;

    // Mock AI summary
    let short_summary = "Coming soon: AI-powered summary.".to_string();
    let relevance_to_officials = vec![
        "Deadline: 15 Sep".to_string(),
        "Tender value: ₹2 Cr".to_string(),
    ];
    let action_items = vec!["Prepare bid".to_string(), "Upload documents".to_string()];
    let confidence_estimate = "high".to_string();

    Ok(Summary {
        short_summary,
        relevance_to_officials,
        action_items,
        confidence_estimate,
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
