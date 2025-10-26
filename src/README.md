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
import { createFSM, state, type FSMFlavor } from "modules/fsm";

// 1. Extend context with FSM flavor
type MyContext = Context & FSMFlavor;

// 2. Define your states using enum
enum RegistrationStates {
  AwaitingName = "awaiting_name",
  AwaitingAge = "awaiting_age",
}

// 3. Create bot with extended context
const bot = new Bot<MyContext>("YOUR_BOT_TOKEN");

// 4. Initialize FSM plugin
bot.use(createFSM({ storage: "memory" }));

// 5. Start registration flow
bot.command("start", async (ctx) => {
  await ctx.reply("What's your name?");
  ctx.state = RegistrationStates.AwaitingName;
});

// 6. Handle name input
bot.filter(state(RegistrationStates.AwaitingName)).on("message:text", async (ctx) => {
  const name = ctx.message.text;

  ctx.data.name = name;
  await ctx.reply("How old are you?");
  ctx.state = RegistrationStates.AwaitingAge;
});

// 7. Handle age input
bot.filter(state(RegistrationStates.AwaitingAge)).on("message:text", async (ctx) => {
  const age = parseInt(ctx.message.text);

  ctx.data.age = age;

  const data = ctx.data.getAll();
  await ctx.reply(`Registration complete!\nName: ${data.name}\nAge: ${data.age}`);

  ctx.fsm.clear();
});

// 8. Cancel anytime
bot.command("cancel", async (ctx) => {
  ctx.fsm.clear();
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

### Using Enums (Recommended)

```typescript
enum OrderStates {
  ChoosingProduct = "choosing_product",
  ChoosingQuantity = "choosing_quantity",
  ConfirmingOrder = "confirming_order",
}

// Usage
ctx.state.set(OrderStates.ChoosingProduct);
// or shorthand:
ctx.state = OrderStates.ChoosingProduct;
```

### Using Constants

```typescript
const STATES = {
  MENU: "menu",
  CATALOG: "catalog",
  CART: "cart",
} as const;

// Usage
ctx.state.set(STATES.MENU);
// or shorthand:
ctx.state = STATES.MENU;
```

## Context API

Once you add the FSM plugin, your context provides these methods:

### State Management

```typescript
// Set current state (synchronous!)
ctx.state.set("state_name");
ctx.state.set(MyStates.Registration);
// Or use the shorthand:
ctx.state = "state_name";

// Get current state (synchronous!)
const state = ctx.state.get(); // Returns string | null

// Check if user has any state (synchronous!)
const hasState = ctx.state.has(); // Returns boolean

// Clear state only
ctx.state.clear();
// Or use shorthand:
ctx.state = undefined;
ctx.state = null;

// Clear state and data
ctx.fsm.clear();
```

### Data Management

```typescript
// Set all data (overwrites) - synchronous!
ctx.data.setAll({ name: "John", age: 25 });

// Get all data - synchronous!
const data = ctx.data.getAll(); // Returns { name: "John", age: 25 }

// Update data (merges with existing) - synchronous!
ctx.data.update({ city: "NYC" });
// Now: { name: "John", age: 25, city: "NYC" }

// Set individual field - synchronous!
ctx.data.set("email", "john@example.com");
ctx.data.email = "john@example.com"; // direct access

// Get individual field - synchronous!
const name = ctx.data.get<string>("name"); // "John"
const name2 = ctx.data.name; // direct access

// Delete field
ctx.data.delete("age");

// Clear data only
ctx.data.clear();
// Or use shorthand:
ctx.data = undefined;
ctx.data = null;
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
enum FormStates {
  AwaitingEmail = "awaiting_email",
  AwaitingPhone = "awaiting_phone",
  AwaitingConfirmation = "awaiting_confirmation",
}

bot.command("form", async (ctx) => {
  await ctx.reply("Please enter your email:");
  ctx.state = FormStates.AwaitingEmail;
});

bot.filter(state(FormStates.AwaitingEmail)).on("message:text", async (ctx) => {
  const email = ctx.message.text;

  // Validate email
  if (!email?.includes("@")) {
    await ctx.reply("Invalid email. Please try again:");
    return; // Stay in same state
  }

  ctx.data.email = email;
  await ctx.reply("Please enter your phone number:");
  ctx.state = FormStates.AwaitingPhone;
});

bot.filter(state(FormStates.AwaitingPhone)).on("message:text", async (ctx) => {
  const phone = ctx.message.text;

  // Validate phone
  if (!/^\+?\d{10,15}$/.test(phone || "")) {
    await ctx.reply("Invalid phone. Please try again:");
    return;
  }

  ctx.data.phone = phone;

  const data = ctx.data.getAll();
  await ctx.reply(
    `Please confirm:\nEmail: ${data.email}\nPhone: ${data.phone}\n\nType 'yes' to confirm`
  );
  ctx.state = FormStates.AwaitingConfirmation;
});

bot.filter(state(FormStates.AwaitingConfirmation)).on("message:text", async (ctx) => {
  const text = ctx.message.text.toLowerCase();

  if (text === "yes") {
    const data = ctx.data.getAll();
    // Save to database...
    await ctx.reply("Form submitted successfully!");
    ctx.fsm.clear();
  } else {
    await ctx.reply("Form cancelled");
    ctx.fsm.clear();
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
enum ShopStates {
  Browsing = "browsing",
  AddingToCart = "adding_to_cart",
  Checkout = "checkout",
}

bot.command("shop", async (ctx) => {
  await ctx.reply("Welcome to shop!");
  ctx.state = ShopStates.Browsing;
  ctx.data.setAll({ cart: [] });
});

bot.filter(state(ShopStates.Browsing)).on("callback_query:data", async (ctx) => {
  const productId = ctx.callbackQuery.data;

  ctx.state = ShopStates.AddingToCart;
  ctx.data.selectedProduct = productId;
  await ctx.reply("How many do you want?");
});

bot.filter(state(ShopStates.AddingToCart)).on("message:text", async (ctx) => {
  const quantity = parseInt(ctx.message.text || "1");
  const productId = ctx.data.selectedProduct;

  // Get current cart
  const cart = ctx.data.get<any[]>("cart") || [];
  cart.push({ productId, quantity });

  ctx.data.cart = cart;
  ctx.state = ShopStates.Browsing;
  await ctx.reply("Added to cart!");
});

bot.command("checkout").filter(state(ShopStates.Browsing), async (ctx) => {
  const cart = ctx.data.cart;

  if (!cart || cart.length === 0) {
    await ctx.reply("Your cart is empty!");
    return;
  }

  ctx.state = ShopStates.Checkout;
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
const data = ctx.data.getAll<UserRegistrationData>();
console.log(data.name); // TypeScript knows this is a string

// Get typed field
const age = ctx.data.get<number>("age");
console.log(age); // TypeScript knows this is number | undefined

// Direct access with type assertion
const data2 = ctx.data as unknown as UserRegistrationData;
console.log(data2.name); // TypeScript knows this is a string
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

### Context Methods

**State Namespace (`ctx.state`):**
- `state.set(state)`: Set user's state
- `state.get()`: Get current state
- `state.has()`: Check if user has a state
- `state.clear()`: Clear state only
- `state = "value"`: Shorthand for `state.set(value)`
- `state = undefined`: Shorthand for `state.clear()`

**Data Namespace (`ctx.data`):**
- `data.setAll(data)`: Set all data (overwrites)
- `data.getAll<T>()`: Get all data
- `data.update(data)`: Update data (merges)
- `data.get<T>(key)`: Get single field
- `data.set(key, value)`: Set single field
- `data.delete(key)`: Delete single field
- `data.clear()`: Clear data only
- `data = undefined`: Shorthand for `data.clear()`
- `data.fieldName`: Direct field access (get/set)

**General (`ctx.fsm`):**
- `clear()`: Clear both state and all data

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
