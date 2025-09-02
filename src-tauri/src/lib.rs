use pdf_extract::extract_text;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Serialize, Deserialize)]
pub struct Summary {
    pub short_summary: String,
    pub relevance_to_officials: Vec<String>,
    pub action_items: Vec<String>,
    pub confidence_estimate: String,
    pub raw_text: String,
}

#[command]
async fn summarize_text(file_path: String) -> Result<Summary, String> {
    let text: String = tokio::task::spawn_blocking(move || extract_text(&file_path))
        .await
        .map_err(|e: tokio::task::JoinError| format!("Task failed: {}", e))?
        .map_err(|e: pdf_extract::OutputError| format!("Failed to extract text: {}", e))?;

    if text.is_empty() {
        return Err("No text extracted from PDF".to_string());
    }

    let short_summary: String = format!(
        "Summary of {} characters from PDF: This is a placeholder.",
        text.len()
    );
    let relevance_to_officials: Vec<String> = vec![
        "Deadline: 15 Sep".to_string(),
        "Tender value: ₹2 Cr".to_string(),
    ];
    let action_items: Vec<String> = vec!["Prepare bid".to_string(), "Upload documents".to_string()];
    let confidence_estimate: String = "medium".to_string();

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
        .invoke_handler(tauri::generate_handler![summarize_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
