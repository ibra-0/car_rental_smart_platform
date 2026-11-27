import type { User } from "../types";
import { validateCustomer } from "../utils/rental";
export const authService = {
  signIn(name: string, email: string, password: string): User {
    const error = validateCustomer(name, email);
    if (error) throw new Error(error);
    if (password.length < 8)
      throw new Error("Use at least 8 characters for the demo password.");
    return { id: "demo-customer", name: name.trim(), email };
  },
  demo: (): User => ({
    id: "demo-customer",
    name: "Demo driver",
    email: "driver@example.com",
  }),
};
