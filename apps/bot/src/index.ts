import 'reflect-metadata';
import { container, singleton } from 'tsyringe';

@singleton()
export class Main {
	works: boolean;

	constructor() {
		this.works = true;
	}

	test() {
		console.log(`This works! and this.works in the singleton = ${this.works}`);
	}
}

container.resolve(Main).test();
