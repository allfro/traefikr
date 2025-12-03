import {ActionIcon, TextInput} from "@mantine/core";
import {IconWand} from "@tabler/icons-react";
import {useState} from "react";
import {RuleBuilder} from "@/components/RuleBuilder.tsx";
import {Protocol} from "@/lib/api.ts";

interface RuleBuilderTextInputProps {
    value: string;
    protocol: Protocol;
    onChange: (value: string) => void;
    label?: string;
    description?: string;
    required?: boolean;
    disabled?: boolean;
}

export default function RuleBuilderTextInput({
                                                 label,
                                                 value,
                                                 onChange,
                                                 description,
                                                 required,
                                                 disabled,
                                                 protocol
                                             }: RuleBuilderTextInputProps) {
    const [opened, setOpened] = useState(false);

    const handleSave = (rule: string) => {
        setOpened(false);
        onChange(rule);
    }

    const handleClose = () => setOpened(false);

    return (
        <>
            <TextInput
                label={label}
                description={description}
                value={value || ''}
                onChange={(e) => onChange(e.currentTarget.value)}
                required={required}
                disabled={disabled}
                rightSection={
                    <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => {
                            setOpened(true)
                        }}
                        disabled={disabled}
                    >
                        <IconWand size={16}/>
                    </ActionIcon>
                }
            />
            <RuleBuilder opened={opened} initialRule={value} protocol={protocol} onClose={handleClose}
                         onSave={handleSave}/>
        </>
    )
}