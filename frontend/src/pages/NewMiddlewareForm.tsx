import Form from '@rjsf/mantine';
import {
    ArrayFieldTemplateProps,
    ErrorTransformer,
    FieldProps,
    ObjectFieldTemplateProps,
    RJSFValidationError
} from '@rjsf/utils';
import {getDefaultRegistry} from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import {Button, Card, Fieldset, Group, Paper, Space, Stack, Switch, Tabs, Text} from "@mantine/core";
import _ from "lodash";
import React, {useState} from "react";
import {IconPlus} from "@tabler/icons-react";
import {ResourceSelector} from "@/components/ResourceSelector.tsx";
import {useForm} from "@mantine/form";
import {Protocol, ResourceType} from "@/lib/api.ts";
import RuleBuilderTextInput from "@/components/RuleBuilderTextInput.tsx";
import schema from '../../schemas/any_entrypoints.json'


export function NewMiddlewareForm() {
    const form = useForm({
        // initialValues: {
        //     name: '',
        //     protocol: "http",
        //     type: "type",
        //     config: {}
        // },
        // validate: {
        //     name: (value) => {
        //         if (_.isEmpty(value))
        //             return 'A service name is required';
        //         else if (!/^[a-zA-Z0-9_-]+$/.test(value))
        //             return 'Service names can only contain alphanumeric characters, underscores, and dashes';
        //         return null
        //     },
        // }
    });

    const TabbedObjectFieldTemplate = (
        {
            fieldPathId,
            properties,
            schema
        }: ObjectFieldTemplateProps
    ) => {

        if (fieldPathId.$id === 'root' && properties.length === 1) {
            return (
                <Stack gap={'md'}>
                    {properties.map(prop => (
                        <div key={prop.content.key}>{prop.content}</div>
                    ))}
                </Stack>
            )
        }

        if (fieldPathId.path.length === 1 || fieldPathId.$id === 'root') {
            const objectProperties = properties.filter(prop => _.get(prop, 'content.props.schema.type', 'object') === 'object' && _.get(prop, 'content.props.schema.properties', []).length !== 0);
            const simpleProperties = properties.filter(prop => _.get(prop, 'content.props.schema.type', 'object') !== 'object' || _.get(prop, 'content.props.schema.properties', []).length === 0);
            const defaultTab = simpleProperties.length > 0 ? 'general' : objectProperties[0]?.name

            console.log('simple=', simpleProperties, 'object=', objectProperties, 'default=', defaultTab)

            return (
                <Tabs defaultValue={defaultTab} keepMounted={false}>
                    <Tabs.List>
                        {simpleProperties.length > 0 && <Tabs.Tab value={'general'}>General</Tabs.Tab>}
                        {objectProperties.map(prop => {
                            return (
                                <Tabs.Tab key={prop.content.key} value={prop.name}>
                                    {_.get(prop, 'content.props.schema.title', prop?.name)}
                                </Tabs.Tab>
                            );
                        })}
                    </Tabs.List>
                    <Tabs.Panel value={'general'}>
                        <Space h="sm"/>
                        <Stack gap={'md'}>
                            {simpleProperties.map(prop => {
                                return (
                                    <div key={prop.content.key}>{prop.content}</div>
                                );
                            })}
                        </Stack>
                        <Space h="sm"/>
                    </Tabs.Panel>
                    {objectProperties.map(prop => (
                        <Tabs.Panel value={prop.name} key={prop.content.key}>
                            <Space h="sm"/>
                            {prop.content}
                            <Space h="sm"/>
                        </Tabs.Panel>
                    ))}
                </Tabs>
            );
        }


        if (fieldPathId.path.length === 2) {
            return (
                <Stack gap={'md'}>
                    {properties.map(prop => (
                        <div key={prop.content.key}>{prop.content}</div>
                    ))}
                </Stack>
            )
        }

        if (fieldPathId.path.length >= 2) {

            return (
                <Fieldset legend={<Text size={'sm'} fw={500}>{schema.title}</Text>}>
                    <Stack gap={'md'}>
                        {properties.map(prop => (
                            <div key={prop.content.key}>{prop.content}</div>
                        ))}
                    </Stack>
                </Fieldset>
            );
        }


    };


    const transformErrors: ErrorTransformer = (errors) => {
        return _.filter(errors, (e: RJSFValidationError) => e?.property?.startsWith('.')) as RJSFValidationError[]
    }


    const CustomBooleanField = ({formData, defaultChecked, schema, onChange, fieldPathId, errorSchema}: FieldProps) => {
        const [enabled, setEnabled] = React.useState(formData);

        return (
            <Switch
                defaultChecked={defaultChecked}
                checked={enabled}
                color="cyan"
                label={schema.title}
                description={schema.description}
                size="sm"
                onChange={(e) => {
                    setEnabled(e.target.checked);
                    onChange(e.target.checked, fieldPathId.path, errorSchema);
                }}
            />
        )
    }

    const CustomBooleanField2 = ({formData, schema, onChange, fieldPathId, errorSchema}: FieldProps) => {
        const [enabled, setEnabled] = React.useState(!_.isEmpty(formData));

        return (
            <Switch
                checked={enabled}
                color="cyan"
                label={schema.title}
                description={schema.description}
                size="sm"
                onChange={(e) => {
                    const newValue = e.target.checked && {} || undefined;
                    setEnabled(e.target.checked);
                    onChange(newValue, fieldPathId.path, errorSchema);
                }}
            />
        )
    }

    const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
        const {schema, items, canAdd, onAddClick, readonly} = props;
        return (
            <Fieldset>
                <Stack gap={'sm'}>

                    <Group justify={'space-between'}>
                        <div>
                            <Text size={'sm'} fw={500}>{schema.title}</Text>
                            <Text size={'xs'} c={'dimmed'}>{schema.description}</Text>
                        </div>
                        {canAdd && !readonly && (
                            <Button variant="filled" color="cyan" size="xs" onClick={onAddClick}
                                    leftSection={<IconPlus size={14}/>}>Add</Button>
                        )}
                    </Group>
                    {items.length === 0 && (
                        <Paper p="sm" shadow={'none'} withBorder style={{textAlign: 'center'}}>
                            <Text size="sm" c="dimmed">
                                No items. {!readonly && 'Click "Add" to add an item'}
                            </Text>
                        </Paper>
                    ) || items}
                </Stack>
            </Fieldset>
        );
    };

    const {
        fields: {StringField},
    } = getDefaultRegistry();

    const TypedStringField = (props: FieldProps) => {
        const {schema} = props;

        if (schema?.$comment?.startsWith('type=')) {
            const [protocol, resourceType] = schema.$comment
                .replace("type=", "")
                .split("/", 2) as [Protocol, string];

            if (resourceType === 'rules') {
                return <RuleBuilderTextInput
                    value={props.formData}
                    onChange={(value) => props.onChange(value, props.fieldPathId.path, props.errorSchema)}
                    description={schema.description}
                    protocol={protocol}
                    label={schema.title}
                />
            }

            return <ResourceSelectField resourceType={resourceType as ResourceType} protocol={protocol} {...props}/>;
        }

        return <StringField {...props}/>
    }

    const ResourceSelectField = (
        {
            formData,
            schema,
            onChange,
            fieldPathId,
            errorSchema,
            readonly,
            disabled,
            required,
            protocol,
            resourceType
        }: FieldProps & { resourceType: ResourceType, protocol: Protocol }
    ) => {
        const [name, setName] = useState(formData)
        return (
            <ResourceSelector
                label={schema.title}
                description={schema.description}
                protocol={protocol}
                type={resourceType}
                readonly={readonly}
                required={required}
                disabled={disabled}
                value={name}
                onChange={(value) => {
                    setName(value)
                    onChange(value, fieldPathId.path, errorSchema)
                }}
            />
        )
    }

    return (
        <Card>
            {/*<form onSubmit={form.onSubmit(console.log)}>*/}
            {/*    <TextInput*/}
            {/*        label={"Service Name"}*/}
            {/*        required*/}
            {/*        description={"The name of the service"}*/}
            {/*        {...form.getInputProps('name')}*/}
            {/*        autoFocus*/}
            {/*    />*/}
            {/*</form>*/}
            {/*<Space h={'sm'}/>*/}
            {/*<div>*/}
            {/*    <Text size={'sm'} fw={500}>Service Type</Text>*/}
            {/*    <Text size={'xs'} c={'dimmed'}>The way in which backend servers/services are connected to the*/}
            {/*        router</Text>*/}
            {/*</div>*/}
            <Space h={5}/>
            <Form schema={schema}
                  formData={{}}
                  validator={validator}
                  onSubmit={({formData}) => {
                      // Validate Mantine form first
                      const validation = form.validate();

                      if (validation.hasErrors) {
                          console.log('Mantine validation failed:', validation.errors);
                          return; // Stop submission
                      }

                      // Both forms are valid
                      console.log('All valid!', {
                          ...form.values,
                          config: formData
                      });

                      // Submit to API or do whatever you need
                  }}
                  onFocus={console.log.bind(null, 'focus')}
                  showErrorList={'bottom'}
                  transformErrors={transformErrors}
                  focusOnFirstError={false}
                  onError={console.error.bind(null, 'errors')}
                  formContext={{traefikProtocol: 'http', traefikType: 'services'}}
                  templates={{
                      ObjectFieldTemplate: TabbedObjectFieldTemplate,
                      ArrayFieldTemplate,
                      // ArrayFieldItemButtonsTemplate
                  }}
                  fields={{
                      BooleanField: CustomBooleanField,
                      StringField: TypedStringField,
                      "/services/parentHealthCheck": CustomBooleanField2,
                      // "/services/serviceName": ServiceSelectField
                  }}
                // readonly
                  omitExtraData
            />
        </Card>
    )
}