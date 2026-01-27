import { icons, type IconName } from "@/public/assets/icons";

type Props = {
    name: IconName;
    className?: string;
};

export function Icon({ name, className }: Props) {
    const IconComponent = icons[name];
    return <IconComponent className={className} aria-hidden="true" />;
}