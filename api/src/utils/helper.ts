interface BuildAvatarPromptParams {
    age?: string;
    gender?: string;
    ethnicity?: string;
    expression?: string;
    hair?: string;
    eyes?: string;
    outfit?: string;
    environment?: string;
    style?: string;
}

export const buildAvatarPrompt = (
    data: BuildAvatarPromptParams
): string => {

    const parts = [

        "Ultra realistic professional portrait",

        data.gender || '',

        data.ethnicity || '',

        data.age
            ? `person in ${data.age}`
            : '',

        data.expression
            ? `${data.expression} expression`
            : '',

        data.hair || '',

        data.eyes || '',

        data.outfit
            ? `wearing ${data.outfit}`
            : '',

        data.environment
            ? `standing in ${data.environment}`
            : '',

        "natural skin texture",

        "cinematic lighting",

        "DSLR photography",

        "shallow depth of field",

        "highly detailed face",

        "photorealistic",
    ];

    return parts
        .filter(Boolean)
        .join(', ');
};