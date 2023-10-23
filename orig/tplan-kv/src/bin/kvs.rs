use std::process;

use clap::{Args, Parser, Subcommand};

#[derive(Parser, Debug)]
#[command(name = "kvs", author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    #[command(arg_required_else_help = true)]
    Get(Get),
    #[command(arg_required_else_help = true)]
    Set(Set),
    #[command(arg_required_else_help = true)]
    Rm(Rm),
}

#[derive(Debug, Args)]
struct Get {
    #[arg(required = true)]
    key: String,
}

#[derive(Debug, Args)]
struct Set {
    #[arg(required = true)]
    key: String,
    #[arg(required = true)]
    value: String,
}

#[derive(Debug, Args)]
struct Rm {
    #[arg(required = true)]
    key: String,
}

fn main() {
    let args = Cli::parse();

    match args.command {
        Commands::Get(get) => {
            eprintln!("unimplemented");
            process::exit(1);
        }
        Commands::Set(set) => {
            eprintln!("unimplemented");
            process::exit(1);
        }
        Commands::Rm(rm) => {
            eprintln!("unimplemented");
            process::exit(1);
        }
    }
}
