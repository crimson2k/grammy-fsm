# FSM Module for Grammy

A full-featured Finite State Machine (FSM) implementation for the [Grammy](https://grammy.dev) bot framework, inspired by [Aiogram's FSM](https://docs.aiogram.dev/en/latest/dispatcher/finite_state_machine.html).

## Features

- ✅ **Multiple Storage Backends**: Memory (development) and Redis (production)
- ✅ **Type-Safe State Management**: Define states using classes or constants
- ✅ **Flexible Data Storage**: Store and retrieve user-specific data
- ✅ **Middleware Filters**: Filter handlers based on current state
- ✅ **State Change Callbacks**: React to state transitions
- ✅ **TTL Support**: Automatic cleanup of expired states (Redis)
- ✅ **Fully Typed**: Complete TypeScript support
- ✅ **Zero Dependencies**: Only requires Grammy and ioredis (for Redis)

## Installation

This module is already included in the project. No additional installation required.

For external projects:
```bash
npm install grammy
# For Redis support
npm install ioredis
```

## Quick Start

```typescript
import { Bot, type Context } from "grammy";
import { createFSM, state, State, StatesGroup, type FSMFlavor } from "modules/fsm";

// 1. Extend context with FSM flavor
type MyContext = Context & FSMFlavor;

// 2. Define your states
class RegistrationStates extends StatesGroup {
  static awaitingName = new State("awaiting_name");
  static awaitingAge = new State("awaiting_age");
}

// 3. Create bot with extended context
const bot = new Bot<MyContext>("YOUR_BOT_TOKEN");

// 4. Initialize FSM plugin
bot.use(createFSM({ storage: "memory" }));

// 5. Start registration flow
bot.command("start", async (ctx) => {
  await ctx.reply("What's your name?");
  await ctx.fsm.setState(RegistrationStates.awaitingName);
});

// 6. Handle name input
bot.filter(state(RegistrationStates.awaitingName)).on("message:text", async (ctx) => {
  const name = ctx.message.text;

  await ctx.fsm.set("name", name);
  await ctx.reply("How old are you?");
  await ctx.fsm.setState(RegistrationStates.awaitingAge);
});

// 7. Handle age input
bot.filter(state(RegistrationStates.awaitingAge)).on("message:text", async (ctx) => {
  const age = parseInt(ctx.message.text);

  await ctx.fsm.set("age", age);

  const data = await ctx.fsm.getData();
  await ctx.reply(`Registration complete!\nName: ${data.name}\nAge: ${data.age}`);

  await ctx.fsm.clear();
});

// 8. Cancel anytime
bot.command("cancel", async (ctx) => {
  await ctx.fsm.clear();
  await ctx.reply("Cancelled");
});

bot.start();
```

## Storage Options

### Memory Storage (Development)

Perfect for development and testing. Data is lost when the bot restarts.

```typescript
bot.use(createFSM({
  storage: "memory"
}));
```

### Redis Storage (Production)

For production environments. Provides persistence and scalability.

```typescript
import { Redis } from "ioredis";

const redis = new Redis({
  host: "localhost",
  port: 6379,
});

bot.use(createFSM({
  storage: "redis",
  redis: {
    client: redis,
    keyPrefix: "bot:fsm:", // Optional, default: "fsm:"
  },
  ttl: 3600, // Optional: auto-cleanup after 1 hour
}));
```

### Custom Storage

Implement your own storage backend:

```typescript
import type { FSMStorage } from "modules/fsm";

class MyCustomStorage implements FSMStorage {
  async setState(userId: number, state: string): Promise<void> { /* ... */ }
  async getState(userId: number): Promise<string | null> { /* ... */ }
  async setData(userId: number, data: Record<string, any>): Promise<void> { /* ... */ }
  async getData(userId: number): Promise<Record<string, any> | null> { /* ... */ }
  async updateData(userId: number, data: Record<string, any>): Promise<void> { /* ... */ }
  async clear(userId: number): Promise<void> { /* ... */ }
}

bot.use(createFSM({ storage: new MyCustomStorage() }));
```

## Defining States

### Using Classes (Recommended)

```typescript
class OrderStates extends StatesGroup {
  static choosingProduct = new State("choosing_product");
  static choosingQuantity = new State("choosing_quantity");
  static confirmingOrder = new State("confirming_order");
}

// Usage
await ctx.fsm.setState(OrderStates.choosingProduct);
```

### Using Constants

```typescript
const STATES = {
  MENU: "menu",
  CATALOG: "catalog",
  CART: "cart",
} as const;

// Usage
await ctx.fsm.setState(STATES.MENU);
```

## Context API

Once you add the FSM plugin, `ctx.fsm` provides these methods:

### State Management

```typescript
// Set current state
await ctx.fsm.setState("state_name");
await ctx.fsm.setState(MyStates.registration);

// Get current state
const state = await ctx.fsm.getState(); // Returns string | null

// Check if user has any state
const hasState = await ctx.fsm.hasState(); // Returns boolean

// Clear state and data
await ctx.fsm.clear();
```

### Data Management

```typescript
// Set all data (overwrites)
await ctx.fsm.setData({ name: "John", age: 25 });

// Get all data
const data = await ctx.fsm.getData(); // Returns { name: "John", age: 25 }

// Update data (merges with existing)
await ctx.fsm.updateData({ city: "NYC" });
// Now: { name: "John", age: 25, city: "NYC" }

// Set individual field
await ctx.fsm.set("email", "john@example.com");

// Get individual field
const name = await ctx.fsm.get<string>("name"); // "John"

// Delete field
await ctx.fsm.delete("age");
```

## Middleware Filters

### `state()` - Single State Filter

Only run handler if user is in specific state:

```typescript
bot.filter(state("awaiting_name"), async (ctx) => {
  // Only runs when user is in "awaiting_name" state
});

bot.filter(state(MyStates.registration), async (ctx) => {
  // Works with State classes
});
```

### `states()` - Multiple States Filter

Run handler if user is in any of the specified states:

```typescript
bot.filter(states("state1", "state2", "state3"), async (ctx) => {
  // Runs if user is in state1, state2, OR state3
});

bot.on("message",
  states(MyStates.step1, MyStates.step2),
  async (ctx) => {
    // Works with State classes
  }
);
```

### `inAnyState()` - Has Any State

Run handler only if user has some state set (any state):

```typescript
bot.filter(inAnyState()).on("message", async (ctx) => {
  // Runs only if user has a state (not null)
});
```

### `noState()` - No State Set

Run handler only if user has no state:

```typescript
bot.filter(noState()).on("message", async (ctx) => {
  // Runs only if user has no state
});
```

## Advanced Examples

### Multi-Step Form with Validation

```typescript
class FormStates extends StatesGroup {
  static awaitingEmail = new State("awaiting_email");
  static awaitingPhone = new State("awaiting_phone");
  static awaitingConfirmation = new State("awaiting_confirmation");
}

bot.command("form", async (ctx) => {
  await ctx.reply("Please enter your email:");
  await ctx.fsm.setState(FormStates.awaitingEmail);
});

bot.filter(state(FormStates.awaitingEmail), async (ctx) => {
  const email = ctx.message?.text;

  // Validate email
  if (!email?.includes("@")) {
    await ctx.reply("Invalid email. Please try again:");
    return; // Stay in same state
  }

  await ctx.fsm.set("email", email);
  await ctx.reply("Please enter your phone number:");
  await ctx.fsm.setState(FormStates.awaitingPhone);
});

bot.filter(state(FormStates.awaitingPhone), async (ctx) => {
  const phone = ctx.message?.text;

  // Validate phone
  if (!/^\+?\d{10,15}$/.test(phone || "")) {
    await ctx.reply("Invalid phone. Please try again:");
    return;
  }

  await ctx.fsm.set("phone", phone);

  const data = await ctx.fsm.getData();
  await ctx.reply(
    `Please confirm:\nEmail: ${data.email}\nPhone: ${data.phone}\n\nType 'yes' to confirm`
  );
  await ctx.fsm.setState(FormStates.awaitingConfirmation);
});

bot.filter(state(FormStates.awaitingConfirmation), async (ctx) => {
  const text = ctx.message?.text?.toLowerCase();

  if (text === "yes") {
    const data = await ctx.fsm.getData();
    // Save to database...
    await ctx.reply("Form submitted successfully!");
    await ctx.fsm.clear();
  } else {
    await ctx.reply("Form cancelled");
    await ctx.fsm.clear();
  }
});
```

### State Change Logging

```typescript
bot.use(createFSM({
  storage: "memory",
  onStateChange: async (userId, oldState, newState) => {
    console.log(`User ${userId}: ${oldState ?? "none"} -> ${newState ?? "none"}`);

    // You can also save to database, send analytics, etc.
  }
}));
```

### Shopping Cart with States

```typescript
class ShopStates extends StatesGroup {
  static browsing = new State("browsing");
  static addingToCart = new State("adding_to_cart");
  static checkout = new State("checkout");
}

bot.command("shop", async (ctx) => {
  await ctx.reply("Welcome to shop!");
  await ctx.fsm.setState(ShopStates.browsing);
  await ctx.fsm.setData({ cart: [] });
});

bot.filter(state(ShopStates.browsing), async (ctx) => {
  const productId = ctx.callbackQuery?.data;

  await ctx.fsm.setState(ShopStates.addingToCart);
  await ctx.fsm.set("selectedProduct", productId);
  await ctx.reply("How many do you want?");
});

bot.filter(state(ShopStates.addingToCart), async (ctx) => {
  const quantity = parseInt(ctx.message?.text || "1");
  const productId = await ctx.fsm.get("selectedProduct");

  // Get current cart
  const cart = await ctx.fsm.get<any[]>("cart") || [];
  cart.push({ productId, quantity });

  await ctx.fsm.set("cart", cart);
  await ctx.fsm.setState(ShopStates.browsing);
  await ctx.reply("Added to cart!");
});

bot.command("checkout", state(ShopStates.browsing), async (ctx) => {
  const cart = await ctx.fsm.get("cart");

  if (!cart || cart.length === 0) {
    await ctx.reply("Your cart is empty!");
    return;
  }

  await ctx.fsm.setState(ShopStates.checkout);
  await ctx.reply("Proceeding to checkout...");
});
```

## TypeScript Usage

### Typed Context

```typescript
import { Bot, type Context } from "grammy";
import type { FSMFlavor } from "modules/fsm";

// Extend your context with FSM flavor
type MyContext = Context & FSMFlavor;

const bot = new Bot<MyContext>("TOKEN");
```

### Typed Data

```typescript
interface UserRegistrationData {
  name: string;
  age: number;
  email: string;
}

// Get typed data
const data = await ctx.fsm.getData<UserRegistrationData>();
console.log(data?.name); // TypeScript knows this is a string

// Get typed field
const age = await ctx.fsm.get<number>("age");
console.log(age); // TypeScript knows this is number | undefined
```

## API Reference

### `createFSM(options)`

Creates FSM plugin for Grammy.

**Options:**
- `storage`: `"memory"` | `"redis"` | `FSMStorage` - Storage backend
- `redis?`: Redis configuration (required if `storage: "redis"`)
  - `client`: Redis client instance
  - `keyPrefix?`: Key prefix for Redis keys (default: `"fsm:"`)
- `ttl?`: Time-to-live in seconds for auto-cleanup
- `onStateChange?`: Callback function called on state changes

### Context Methods (`ctx.fsm`)

**State Management:**
- `setState(state)`: Set user's state
- `getState()`: Get current state
- `hasState()`: Check if user has a state
- `clear()`: Clear state and all data

**Data Management:**
- `setData(data)`: Set all data (overwrites)
- `getData<T>()`: Get all data
- `updateData(data)`: Update data (merges)
- `get<T>(key)`: Get single field
- `set(key, value)`: Set single field
- `delete(key)`: Delete single field

### Middleware Filters

- `state(stateName)`: Filter by single state
- `states(...stateNames)`: Filter by multiple states
- `inAnyState()`: Filter users with any state
- `noState()`: Filter users with no state

## Best Practices

1. **Always use `try-catch`** for error handling in state handlers
2. **Validate user input** before transitioning to next state
3. **Clear state** when flow is complete or cancelled
4. **Use meaningful state names** that describe what you're waiting for
5. **Use State classes** for better type safety and autocomplete
6. **Set TTL in production** to prevent memory/storage leaks
7. **Don't store large data** in FSM - use it for temporary flow data only

## License

MIT
