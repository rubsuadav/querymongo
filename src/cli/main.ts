#!/usr/bin/env node

/**
 * CLI para convertir queries SQL a MongoDB
 * Interfaz de línea de comandos usando Commander
 */
import { Command } from "commander";
import chalk from "chalk";
import { mongoConverter } from "../application/MongoConverter.ts";

const program = new Command();

program
  .name("querymongo")
  .description("Convert SQL queries to MongoDB format")
  .version("1.0.0")
  .usage("[command]");

program
  .command("interactive")
  .description("Start interactive mode")
  .action(async () => {
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => rl.question(prompt, resolve));
    };

    console.log(
      chalk.blue("\n📊 SQL to MongoDB Query Converter - Interactive Mode\n"),
    );
    console.log(chalk.gray('Type "exit" to quit\n'));

    while (true) {
      const sql = await question(chalk.yellow("SQL Query > "));

      if (sql.toLowerCase() === "exit") {
        console.log(chalk.blue("Goodbye! 👋\n"));
        rl.close();
        break;
      }

      if (!sql.trim()) continue;

      try {
        const result = mongoConverter.convert(sql);
        console.log(chalk.green("\n✓ MongoDB Query:\n"));
        console.log(chalk.cyan(JSON.stringify(result, null, 2)) + "\n");
      } catch (error) {
        console.error(
          chalk.red(
            `✗ Error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
          ),
        );
      }
    }
  })
  .usage(" ");

program.parse(process.argv);
