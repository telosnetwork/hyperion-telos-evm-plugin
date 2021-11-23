import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {getCacheByHash, timedQuery} from "../../../../../../api/helpers/functions";

import axios from "axios";

const SIG_CACHE_EXPIRE = 60 * 60 * 24; // 24hrs
const FOUR_BYTE_URL = `https://www.4byte.directory`

const sigDirectoryAxios = axios.create({
	baseURL: FOUR_BYTE_URL
});


async function getAbiSignature(fastify: FastifyInstance, request: FastifyRequest) {

	const query: any = request.query;
	const {redis} = fastify;
	const trimmedHex = query.hex.startsWith('0x') ? query.hex.toLowerCase().slice(2) : query.hex.toLowerCase();

	if (query.type === 'function') {
		const [cachedResponse, hash] = await getCacheByHash(redis, `evm-func-sig-${trimmedHex}`, fastify.manager.chain);
		if (cachedResponse) {
			return cachedResponse;
		}

		let text_signature = '';
		const dirResponse = await sigDirectoryAxios.get(`/api/v1/signatures/?hex_signature=0x${trimmedHex}`)
		if (dirResponse?.data?.results?.length >  0) {
			text_signature = dirResponse.data.results[0].text_signature
		}

		fastify.redis.set(hash, text_signature, 'EX', SIG_CACHE_EXPIRE).catch(console.log);
		return text_signature;
	} else if (query.type === 'event') {
		const [cachedResponse, hash] = await getCacheByHash(redis, `evm-func-event-${trimmedHex}`, fastify.manager.chain);
		if (cachedResponse) {
			return cachedResponse;
		}

		let text_signature = '';
		const dirResponse = await sigDirectoryAxios.get(`/api/v1/event-signatures/?hex_signature=0x${trimmedHex}`)
		if (dirResponse?.data?.results?.length >  0) {
			text_signature = dirResponse.data.results[0].text_signature
		}

		fastify.redis.set(hash, text_signature, 'EX', SIG_CACHE_EXPIRE).catch(console.log);
		return { text_signature };
	} else {
		return `invalid type ${query.type}`;
	}

}

export function getAbiSignatureHandler(fastify: FastifyInstance, route: string) {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		reply.send(await timedQuery(getAbiSignature, fastify, request, route));
	}
}
