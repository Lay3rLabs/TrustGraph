use anyhow::Result;
use serde::Deserialize;
use std::{
    fs::File,
    io::{Read, Write},
};
use wstd::http::{IntoBody, Request};
use wstd::io::AsyncRead;

use cid::Cid;
use std::str::FromStr;

/// Uploads a file using multipart request to IPFS (supports both Pinata and local IPFS)
async fn upload_to_ipfs(
    file_path: &str,
    name: &str,
    ipfs_url: &str,
    api_key: Option<&str>,
) -> Result<Cid> {
    eprintln!("Uploading file to IPFS: {}", file_path);

    let mut file = File::open(file_path)?;
    let mut file_bytes = Vec::new();
    file.read_to_end(&mut file_bytes)?;

    // define multipart request boundary
    let boundary = "----RustBoundary";

    let (request_body, content_type) = if let Some(_api_key) = api_key {
        // Pinata format with network parameter
        let body = format!(
            "--{}\r\n\
            Content-Disposition: form-data; name=\"file\"; filename=\"{}\"\r\n\
            Content-Type: application/octet-stream\r\n\r\n",
            boundary, name
        );

        let mut request_body = body.into_bytes();
        request_body.extend_from_slice(&file_bytes);
        request_body.extend_from_slice(format!("\r\n--{}\r\n", boundary).as_bytes());

        // Add network parameter for Pinata
        let network_part = format!(
            "Content-Disposition: form-data; name=\"network\"\r\n\r\n\
            public\r\n\
            --{}--\r\n",
            boundary
        );
        request_body.extend_from_slice(network_part.as_bytes());
        (request_body, format!("multipart/form-data; boundary={}", boundary))
    } else {
        // Local IPFS format - simpler multipart form
        let body = format!(
            "--{}\r\n\
            Content-Disposition: form-data; name=\"file\"; filename=\"{}\"\r\n\
            Content-Type: application/octet-stream\r\n\r\n",
            boundary, name
        );

        let mut request_body = body.into_bytes();
        request_body.extend_from_slice(&file_bytes);
        request_body.extend_from_slice(format!("\r\n--{}--\r\n", boundary).as_bytes());
        (request_body, format!("multipart/form-data; boundary={}", boundary))
    };

    let mut request_builder = Request::post(ipfs_url).header("Content-Type", &content_type);

    // Add authorization header only for Pinata
    if let Some(api_key) = api_key {
        request_builder = request_builder.header("Authorization", &format!("Bearer {}", api_key));
    }

    let request = request_builder.body(request_body.into_body())?;

    let mut response = wstd::http::Client::new().send(request).await?;

    if response.status().is_success() {
        let mut body_buf = Vec::new();
        response.body_mut().read_to_end(&mut body_buf).await?;

        // Log the raw response for debugging
        let response_str = std::str::from_utf8(&body_buf)
            .map_err(|e| anyhow::anyhow!("Failed to convert response to string: {}", e))?;
        eprintln!("IPFS API Response: {}", response_str);

        let hash = if api_key.is_some() {
            // Parse using Pinata's response format (capitalized fields)
            #[derive(Debug, Deserialize)]
            struct PinataResponse {
                data: PinataData,
            }

            #[derive(Debug, Deserialize)]
            struct PinataData {
                cid: String,
            }

            match serde_json::from_slice::<PinataResponse>(&body_buf) {
                Ok(resp) => resp.data.cid,
                Err(_) => {
                    return Err(anyhow::anyhow!(
                        "Could not extract hash from Pinata response: {}",
                        response_str
                    ));
                }
            }
        } else {
            // Parse using local IPFS response format
            #[derive(Debug, Deserialize)]
            struct LocalIpfsResponse {
                #[serde(alias = "Hash")]
                hash: String,
            }

            match serde_json::from_slice::<LocalIpfsResponse>(&body_buf) {
                Ok(resp) => resp.hash,
                Err(_) => {
                    return Err(anyhow::anyhow!(
                        "Could not extract hash from local IPFS response: {}",
                        response_str
                    ));
                }
            }
        };

        // Return the hash directly
        decode_ipfs_cid(&hash).map_err(|e| anyhow::anyhow!("Failed to decode IPFS CID: {}", e))
    } else {
        let mut body_buf = Vec::new();
        response.body_mut().read_to_end(&mut body_buf).await?;
        let error_body = std::str::from_utf8(&body_buf).unwrap_or("unable to read error body");
        Err(anyhow::anyhow!(
            "Failed to upload to IPFS. Status: {:?}, Body: {}",
            response.status(),
            error_body
        ))
    }
}

/// Uploads JSON data directly to IPFS and returns the CID
pub async fn upload_json_to_ipfs(
    json_data: &str,
    name: &str,
    ipfs_url: &str,
    api_key: Option<&str>,
) -> Result<Cid> {
    // Create a temporary file to store the JSON data
    let temp_path = "/tmp/ipfs_data.json";

    eprintln!("Temp path {}", temp_path);

    // Ensure the /tmp directory exists
    std::fs::create_dir_all("/tmp")
        .map_err(|e| anyhow::anyhow!("Failed to create /tmp directory: {}", e))?;

    // Write JSON to temporary file
    let mut file = File::create(temp_path)?;
    file.write_all(json_data.as_bytes())?;

    // Upload the file
    let hash = upload_to_ipfs(temp_path, name, ipfs_url, api_key).await?;

    // Clean up the temporary file
    delete_file(temp_path)?;

    // Return the IPFS URI
    Ok(hash)
}

/// Delete a file from the filesystem
pub fn delete_file(file_path: &str) -> Result<()> {
    std::fs::remove_file(file_path)?;
    println!("File deleted successfully: {}", file_path);
    Ok(())
}

pub fn decode_ipfs_cid(cid_str: &str) -> Result<Cid, String> {
    // Check if the string is a v0 CID (starts with "Qm" and has length 46).
    if cid_str.starts_with("Qm") && cid_str.len() == 46 {
        // Decode as base58
        let decoded = bs58::decode(cid_str).into_vec().map_err(|e| e.to_string())?;
        // Attempt to construct a Cid from the decoded bytes
        let cid = Cid::try_from(decoded).map_err(|e| e.to_string())?;
        Ok(cid)
    } else {
        // Attempt to construct a Cid from the decoded bytes
        let cid = Cid::from_str(cid_str).map_err(|e| e.to_string())?;
        Ok(cid)
    }
}
