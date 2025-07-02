import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { describe, it, expect } from "vitest";

describe("Button component", () => {
  it("renders the given text", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });
});
