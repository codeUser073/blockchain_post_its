// notes_ui/src/types/mysten-sui.d.ts
declare module '@mysten/sui' {
    export class JsonRpcProvider {
        constructor(opts?: any);
        devInspectTransactionBlock(...args: any[]): Promise<any>;
        // allow any other usage you need
        [key: string]: any;
    }
    export namespace transactions { }
    export default any;
}

declare module '@mysten/sui/transactions' {
    export class TransactionBlock {
        constructor();
        moveCall(opts?: any): any;
        object(id: string): any;
        pure(value: any): any;
        [key: string]: any;
    }
    export default any;
}

declare module '@mysten/sui.js' {
    export { JsonRpcProvider } from '@mysten/sui';
    export * from '@mysten/sui/transactions';
    const _default: any;
    export default _default;
}

declare module '@mysten/sui.js/transactions' {
    export * from '@mysten/sui/transactions';
}
