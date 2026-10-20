"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const getMacSnapshot = () => navigator.platform.toUpperCase().includes("MAC");

export function useIsClient() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

export function useIsMac() {
  return useSyncExternalStore(subscribe, getMacSnapshot, getServerSnapshot);
}
