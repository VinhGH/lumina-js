import { runAllSecurityInvariants } from './invariants/security.invariants.js';
import { runAllRetrievalInvariants } from './invariants/retrieval.invariants.js';

runAllSecurityInvariants();
runAllRetrievalInvariants();
