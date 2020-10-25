const storage = Object.create(null);

type Listener = (message:string, publisher?: any, data?: any) => void;
type Subscriber = Listener | {handleMessage:Listener};

export function publish(message: string, publisher?: any, data?: any) {
	let subscribers = storage[message] || [];
	subscribers.forEach((subscriber:Subscriber) => {
		typeof(subscriber) == "function"
			? subscriber(message, publisher, data)
			: subscriber.handleMessage(message, publisher, data);
	});
}

export function subscribe(message:string, subscriber:Subscriber) {
	if (!(message in storage)) { storage[message] = []; }
	storage[message].push(subscriber);
}

export function unsubscribe(message:string, subscriber:Subscriber) {
	let index = (storage[message] || []).indexOf(subscriber);
	if (index > -1) { storage[message].splice(index, 1); }
}
