use regex::Regex;
use std::collections::HashMap;
use unicode_segmentation::UnicodeSegmentation;

#[derive(Debug, Clone)]
pub struct LocalSummary {
    pub short_summary: String,
    pub relevance_to_officials: Vec<String>,
    pub action_items: Vec<String>,
    pub confidence_estimate: String,
}

pub fn summarize_text_local(text: &str, num_sentences: usize) -> Option<LocalSummary> {
    if text.trim().is_empty() {
        return None;
    }

    // 1) Split into sentences
    let sentence_end: Regex = Regex::new(r"[.!?]+").unwrap();
    let sentences: Vec<&str> = sentence_end
        .split(text)
        .filter(|s| !s.trim().is_empty())
        .collect();

    // 2) Count word frequencies
    let mut word_freq: HashMap<String, usize> = HashMap::new();
    for sentence in &sentences {
        for word in sentence.unicode_words() {
            let word: String = word.to_lowercase();
            *word_freq.entry(word).or_insert(0) += 1;
        }
    }

    // 3) Score sentences
    let mut sentence_scores: Vec<(usize, &str)> = Vec::new();
    for sentence in &sentences {
        let mut score: usize = 0;
        for word in sentence.unicode_words() {
            if let Some(freq) = word_freq.get(&word.to_lowercase()) {
                score += *freq;
            }
        }
        sentence_scores.push((score, *sentence));
    }

    // 4) Pick top N
    sentence_scores.sort_by(|a, b| b.0.cmp(&a.0));
    let summary_sentences: Vec<&str> = sentence_scores
        .iter()
        .take(num_sentences)
        .map(|(_, s)| *s)
        .collect();

    let mut short_summary: String = summary_sentences.join(". ");
    if !short_summary.ends_with('.') {
        short_summary.push('.');
    }

    // 5) Mock metadata
    let relevance_to_officials: Vec<String> = vec![
        "Deadline: 15 Sep".to_string(),
        "Tender value: ₹2 Cr".to_string(),
    ];
    let action_items: Vec<String> = vec!["Prepare bid".to_string(), "Upload documents".to_string()];
    let confidence_estimate: String = "medium".to_string();

    Some(LocalSummary {
        short_summary,
        relevance_to_officials,
        action_items,
        confidence_estimate,
    })
}