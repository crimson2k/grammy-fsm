import { Bot, type Context } from "grammy";
import { createFSM, state, type FSMFlavor } from "./index";

// 1. Extend context with FSM flavor
type MyContext = Context & FSMFlavor;

// 2. Define your states using enum
enum RegistrationStates {
  AwaitingName = "awaiting_name",
  AwaitingAge = "awaiting_age",
}

// 3. Create bot with extended context
const bot = new Bot<MyContext>("7993140610:AAEDplCz6tsjOfaw3ozPIQu3uGzWADuw250");

// 4. Initialize FSM plugin
bot.use(createFSM({ storage: "memory" }));

// 5. Cancel anytime (before starting other handlers, so that they don't block the cancellation)
bot.command("cancel", async (ctx) => {
  ctx.fsm.clear();
  await ctx.reply("Cancelled");
});

// 6. Start registration flow
bot.command("start", async (ctx) => {
  await ctx.reply("What's your name?");
  ctx.state = RegistrationStates.AwaitingName;
});

// 7. Handle name input
bot
  .filter(state(RegistrationStates.AwaitingName))
  .on("message:text", async (ctx) => {
    const name = ctx.message.text;

    ctx.data.name = name;
    await ctx.reply("How old are you?");
    ctx.state = RegistrationStates.AwaitingAge;
  });

// 8. Handle age input
bot
  .filter(state(RegistrationStates.AwaitingAge))
  .on("message:text", async (ctx) => {
    const age = parseInt(ctx.message.text);

    ctx.data.age = age;

    const data = ctx.data.getAll();
    await ctx.reply(
      `Registration complete!\nName: ${data.name}\nAge: ${data.age}`,
    );

    ctx.fsm.clear();
  });

bot.start();
