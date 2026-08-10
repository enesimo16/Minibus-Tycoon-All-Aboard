import { Component, ReactNode } from "react";

// Kemal'in modeli henüz teslim etmediği/yolun yanlış olduğu durumlarda
// sahneyi çökertmeden placeholder'a düşer.
export class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
