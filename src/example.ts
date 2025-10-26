/**
 * Example usage of FSM module
 *
 * This file demonstrates how to use the FSM module in a Grammy bot
 * with synchronous API (no await needed for FSM operations!)
 */

import { Bot, type Context } from "grammy";
import { createFSM, state, type FSMFlavor } from "./index";

// Extend context with FSMFlavor
type MyContext = Context & FSMFlavor;

// Define states using enums (simple and clear!)
enum RegistrationStates {
  AwaitingName = "awaiting_name",
  AwaitingAge = "awaiting_age",
  AwaitingEmail = "awaiting_email",
}

enum OrderStates {
  ChoosingProduct = "choosing_product",
  ChoosingQuantity = "choosing_quantity",
  ConfirmingOrder = "confirming_order",
}

/**
 * Example bot setup with FSM
 */
export function createExampleBot(token: string) {
  const bot = new Bot<MyContext>(token);

  // Initialize FSM with memory storage
  bot.use(
    createFSM({
      storage: "memory",
      onStateChange: (userId, oldState, newState) => {
        console.log(
          `User ${userId}: ${oldState ?? "none"} -> ${newState ?? "none"}`,
        );
      },
    }),
  );

  // ========== Registration Flow ==========

  bot.command("register", async (ctx) => {
    await ctx.reply("Welcome! What's your name?");
    // Synchronous! No await needed
    ctx.fsm.setState(RegistrationStates.AwaitingName);
  });

  bot
    .filter(state(RegistrationStates.AwaitingName))
    .on("message:text", async (ctx) => {
      const name = ctx.message.text;

      if (!name || name.length < 2) {
        await ctx.reply("Please enter a valid name (at least 2 characters)");
        return;
      }

      // Synchronous! No await needed
      ctx.fsm.set("name", name);
      await ctx.reply("Great! How old are you?");
      ctx.fsm.setState(RegistrationStates.AwaitingAge);
    });

  bot
    .filter(state(RegistrationStates.AwaitingAge))
    .on("message:text", async (ctx) => {
      const ageText = ctx.message.text;
      const age = Number.parseInt(ageText || "0");

      if (Number.isNaN(age) || age < 1 || age > 120) {
        await ctx.reply("Please enter a valid age (1-120)");
        return;
      }

      // Synchronous! No await needed
      ctx.fsm.set("age", age);
      await ctx.reply("Perfect! What's your email?");
      ctx.fsm.setState(RegistrationStates.AwaitingEmail);
    });

  bot
    .filter(state(RegistrationStates.AwaitingEmail))
    .on("message:text", async (ctx) => {
      const email = ctx.message.text;

      if (!email || !email.includes("@")) {
        await ctx.reply("Please enter a valid email address");
        return;
      }

      // Synchronous! No await needed
      ctx.fsm.set("email", email);

      // Get all data (synchronously!)
      const data = ctx.fsm.getData<{
        name: string;
        age: number;
        email: string;
      }>();

      await ctx.reply(
        `Registration complete!\n\n` +
          `Name: ${data.name}\n` +
          `Age: ${data.age}\n` +
          `Email: ${data.email}`,
      );

      ctx.fsm.clear();
    });

  // ========== Order Flow ==========

  bot.command("order", async (ctx) => {
    await ctx.reply(
      "Welcome to our shop! Choose a product:\n" +
        "1. Coffee - $3\n" +
        "2. Tea - $2\n" +
        "3. Juice - $4",
    );
    ctx.fsm.setState(OrderStates.ChoosingProduct);
  });

  bot
    .filter(state(OrderStates.ChoosingProduct))
    .on("message:text", async (ctx) => {
      const choice = ctx.message.text;

      const products: Record<string, { name: string; price: number }> = {
        "1": { name: "Coffee", price: 3 },
        "2": { name: "Tea", price: 2 },
        "3": { name: "Juice", price: 4 },
      };

      if (!choice || !products[choice]) {
        await ctx.reply("Please choose a valid option (1, 2, or 3)");
        return;
      }

      ctx.fsm.set("product", products[choice]);
      await ctx.reply(
        `You selected ${products[choice].name}. How many do you want?`,
      );
      ctx.fsm.setState(OrderStates.ChoosingQuantity);
    });

  bot
    .filter(state(OrderStates.ChoosingQuantity))
    .on("message:text", async (ctx) => {
      const quantityText = ctx.message.text;
      const quantity = Number.parseInt(quantityText || "0");

      if (Number.isNaN(quantity) || quantity < 1 || quantity > 100) {
        await ctx.reply("Please enter a valid quantity (1-100)");
        return;
      }

      ctx.fsm.set("quantity", quantity);

      // Get single field (synchronously!)
      const product = ctx.fsm.get<{ name: string; price: number }>("product");
      const total = product ? product.price * quantity : 0;

      await ctx.reply(
        `Order summary:\n` +
          `Product: ${product?.name}\n` +
          `Quantity: ${quantity}\n` +
          `Total: $${total}\n\n` +
          `Type 'confirm' to place the order or 'cancel' to cancel`,
      );

      ctx.fsm.setState(OrderStates.ConfirmingOrder);
    });

  bot
    .filter(state(OrderStates.ConfirmingOrder))
    .on("message:text", async (ctx) => {
      const text = ctx.message.text.toLowerCase();

      if (text === "confirm") {
        const data = ctx.fsm.getData<{
          product: { name: string; price: number };
          quantity: number;
        }>();

        await ctx.reply(
          `Order placed successfully!\n` +
            `${data.quantity}x ${data.product.name}\n` +
            `Total: $${data.product.price * data.quantity}`,
        );

        ctx.fsm.clear();
      } else if (text === "cancel") {
        await ctx.reply("Order cancelled");
        ctx.fsm.clear();
      } else {
        await ctx.reply("Please type 'confirm' or 'cancel'");
      }
    });

  // ========== General Commands ==========

  bot.command("cancel", async (ctx) => {
    // Check if user has state (synchronously!)
    if (ctx.fsm.hasState()) {
      ctx.fsm.clear();
      await ctx.reply("Action cancelled");
    } else {
      await ctx.reply("Nothing to cancel");
    }
  });

  bot.command("status", async (ctx) => {
    // Get state and data (synchronously!)
    const currentState = ctx.fsm.getState();
    const data = ctx.fsm.getData();

    if (currentState) {
      await ctx.reply(
        `Current state: ${currentState}\n` + `Data: ${JSON.stringify(data, null, 2)}`,
      );
    } else {
      await ctx.reply("No active state");
    }
  });

  // Alternative syntax: direct property access
  bot.command("alt", async (ctx) => {
    // You can also access state and data directly!
    ctx.fsm.state = RegistrationStates.AwaitingName;
    ctx.fsm.data.name = "John";
    ctx.fsm.data.age = 25;

    await ctx.reply(
      `Set state to: ${ctx.fsm.state}\n` +
        `Name: ${ctx.fsm.data.name}\n` +
        `Age: ${ctx.fsm.data.age}`,
    );
  });

  return bot;
}

// Example usage:
// const bot = createExampleBot("YOUR_BOT_TOKEN");
// bot.start();
