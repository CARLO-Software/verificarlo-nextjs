import AUDI from "./audi.svg";
import BMW from "./bmw.svg";
import BYD from "./byd.svg";
import TOYOTA from "./toyota.svg";

export const icons = {
    audi: AUDI,
    bmw: BMW,
    byd: BYD,
    toyota: TOYOTA,
} as const;

export type IconName = keyof typeof icons;