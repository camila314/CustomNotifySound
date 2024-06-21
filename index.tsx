/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated, camila314, and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin, { OptionType } from "@utils/types";
import { DataStore } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { findByCodeLazy } from "@webpack";
import { useState } from "@webpack/common";

const Upload = findByCodeLazy("fileUploadInput,");

const FILE_KEY = "CustomNotifySound_file";
let chosenAudio: File | null = null;

async function serializeFile(file) {
	let arr = new Uint8Array(await file.arrayBuffer());
	return {
		name: file.name,
		type: file.type,
		size: file.size,
		lastModified: file.lastModified,
		content: Array.from(arr)
	};
}

function deserializeFile(data) {
	let arr = new Uint8Array(data.content);
	return new File([arr], data.name, {
		type: data.type,
		lastModified: data.lastModified
	});
}

const audioFilter = {
	name: "audio",
	extensions: ["mp3", "wav", "ogg", "x-wav", "mp4"]
};

function AudioUpload() {
	const [file, setFile] = useState(chosenAudio);

	const onChooseAudio = async (f) => {
		setFile(f);
		chosenAudio = f;
		await DataStore.set(FILE_KEY, await serializeFile(f));
	};

	return (<>
		<Upload
			buttonText="Choose"
			filename={file?.name}
			filters={[audioFilter]}
			onFileSelect={onChooseAudio}
			placeholder="Choose an audio"
		/>
	</>);
}

const settings = definePluginSettings({
    audio: {
        type: OptionType.COMPONENT,
        component: () => <AudioUpload/>
    }
});

export default definePlugin({
    name: "CustomNotifySound",
    authors: [Devs.camila314],
    description: "Customize the notification sound",
    settings,
    patches: [
    	{
    	    find: ",\".mp3\"",
    	    replacement: {
    	        match: /Audio;(\i)\.src=/,
    	        replace: "Audio; let __aud = this.name == \"message1\" ? $self.getAudioURL() : null; $1.src = __aud ? __aud : "
    	    }
    	},
    ],

    getAudioURL() {
    	return chosenAudio ? URL.createObjectURL(chosenAudio) : null;
    },

    async start() {
    	const data = await DataStore.get(FILE_KEY);
    	if (data) {
			chosenAudio = deserializeFile(data);
    	}
    }
});
