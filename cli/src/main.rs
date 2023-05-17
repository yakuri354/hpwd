use std::io::{stdin, stderr, Write};

use clap::Parser;
use rpassword::prompt_password;
use argon2::{Argon2, Algorithm, Version, Params};

#[derive(Parser)]
#[command(name = "gen-passwd", author, version, about, long_about = None)] // Read from `Cargo.toml`
struct Cli {
    #[arg(short, long, default_value_t = 14)]
    length: usize,

    #[arg(short, long, value_name = "[1-4]", default_value_t = 4)]
    mode: usize,

    /// Optional
    #[arg(short, long)]
    website: Option<String>
}

const CHARSET: &[&str] = &[
     "0123456789",
     "0123456789abcdefghijklmnopqrstuvwxyz",
     "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
     "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:;<=>@[\\]^_`{|}~",
];

fn input_str(prompt: &str) -> String {
    eprint!("{}", prompt);
    stderr().flush().unwrap();
    let mut s = String::new();
    stdin().read_line(&mut s).unwrap();
    s.trim().to_string()
}

fn gen_password(orig_pwd: &str, website: &str, length: usize, mode: usize) -> String {
    let params = Params::new(64, 30, 1, Some(length)).unwrap();
    let ctx = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let salt = "hpwdsalt".to_string() + "$" + website + "$" + length.to_string().as_str() + "$" + mode.to_string().as_str();

    let mut buf = vec![0; length];

    ctx.hash_password_into(orig_pwd.as_bytes(), salt.as_bytes(), &mut buf).unwrap();

    let chars: Vec<char> = CHARSET[mode - 1].chars().collect();

    let password: String = buf.iter().map(|i| chars[*i as usize % chars.len()]).collect();

    if password.chars().into_iter().fold(vec![false; 4], |acc, i| vec![
        acc[0] || i.is_digit(10),
        acc[1] || i.is_ascii_lowercase(),
        acc[2] || i.is_ascii_uppercase(),
        acc[3] || i.is_ascii_punctuation() || i == '\\',
    ])[..mode].contains(&false) {
        gen_password(&password, website, length, mode)
    } else {
        password
    }
}

fn main() {
    let cli = Cli::parse();

    let website = cli.website.unwrap_or_else(|| input_str("Website: "));
    let orig_pwd = prompt_password("Password: ").unwrap();

    let pwd = gen_password(orig_pwd.trim(), website.trim(), cli.length, cli.mode);

    println!("{}", pwd);
}
