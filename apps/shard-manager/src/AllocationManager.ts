export class AllocationManager {
	private seats: (null | string)[]; // Null is an empty seat
	public totalSeats: number;

	constructor(seatCount: number) {
		this.seats = new Array(seatCount).fill(null);

		this.totalSeats = seatCount;
	}

	private find(forId: string) {
		const existingAllocation = this.seats.indexOf(forId);

		return existingAllocation !== -1 ? existingAllocation : this.seats.indexOf(null);
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
		this.seats[seatNumber] = null;
	}

	get full() {
		return this.seats.every((seat) => seat !== null);
	}
}
