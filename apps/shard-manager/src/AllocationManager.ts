export class AllocationManager {
	private seats: ('VACANT' | Omit<string, 'VACANT'>)[];
	public totalSeats: number;

	constructor(seatCount: number) {
		this.seats = new Array(seatCount).fill('VACANT');

		this.totalSeats = seatCount;
	}

	private find(forId: string) {
		const existingAllocation = this.seats.indexOf(forId);

		return existingAllocation !== -1 ? existingAllocation : this.seats.indexOf('VACANT');
	}

	private allocate(seatNumber: number, forId: string) {
		this.seats[seatNumber] = forId;
	}

	findAndAllocate(forId: string) {
		const allocation = this.find(forId);
		const valid = allocation !== -1;

		if (valid) this.allocate(this.find(forId), forId);

		return { allocation, valid };
	}

	deallocate(seatNumber: number) {
		this.seats[seatNumber] = 'VACANT';
	}

	get full() {
		return this.seats.every((seat) => seat !== 'VACANT');
	}
}
