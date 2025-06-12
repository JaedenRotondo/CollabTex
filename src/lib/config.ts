export const config = {
	signaling: {
		url: import.meta.env.VITE_SIGNALING_URL || 'ws://localhost:4444'
	}
};
