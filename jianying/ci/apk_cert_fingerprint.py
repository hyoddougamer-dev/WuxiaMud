#!/usr/bin/env python3
"""Prints the SHA-256 fingerprint of the certificate an APK is signed with.

Android APKs targeting minSdk >= 24 are signed with scheme v2/v3 only, so there
is no META-INF certificate to read with keytool, and `apksigner` is not always
on the machine that needs the answer. This parses the APK Signing Block
directly.

The fingerprint is the same value `keytool -list` reports for the signing key,
so CI can compare an assembled APK against the keystore it was supposed to use.
That comparison exists because a build once produced a perfectly healthy-looking
APK signed with the wrong key, which then refused to install over its
predecessor with no diagnostic anywhere.

Usage: apk_cert_fingerprint.py <file.apk>
"""
import hashlib
import struct
import sys

MAGIC = b"APK Sig Block 42"
SCHEME_IDS = {0x7109871A: "v2", 0xF05368C0: "v3"}


def _length_prefixed(buf: bytes):
    """Yields each uint32-length-prefixed chunk in `buf`."""
    off = 0
    while off + 4 <= len(buf):
        (length,) = struct.unpack_from("<I", buf, off)
        yield buf[off + 4 : off + 4 + length]
        off += 4 + length


def _id_value_pairs(buf: bytes):
    """Yields (id, value) for each uint64-length-prefixed pair in the block."""
    off = 0
    while off + 12 <= len(buf):
        (length,) = struct.unpack_from("<Q", buf, off)
        (pair_id,) = struct.unpack_from("<I", buf, off + 8)
        yield pair_id, buf[off + 12 : off + 8 + length]
        off += 8 + length


def signing_block(data: bytes) -> bytes:
    eocd = data.rfind(b"PK\x05\x06")
    if eocd < 0:
        raise ValueError("nao e um zip: falta o End Of Central Directory")
    (cd_offset,) = struct.unpack_from("<I", data, eocd + 16)

    magic_at = data.rfind(MAGIC, 0, cd_offset)
    if magic_at < 0:
        raise ValueError("APK sem Signing Block (nao assinado com v2/v3)")

    (size_at_end,) = struct.unpack_from("<Q", data, magic_at - 8)
    start = magic_at + 16 - (size_at_end + 8)
    (size_at_start,) = struct.unpack_from("<Q", data, start)
    if size_at_start != size_at_end:
        raise ValueError("APK Signing Block inconsistente")

    return data[start + 8 : magic_at - 8]


def fingerprints(path: str) -> dict[str, str]:
    with open(path, "rb") as handle:
        data = handle.read()

    found: dict[str, str] = {}
    for pair_id, value in _id_value_pairs(signing_block(data)):
        scheme = SCHEME_IDS.get(pair_id)
        if scheme is None:
            continue
        for signers in _length_prefixed(value):
            for signer in _length_prefixed(signers):
                signed_data = next(_length_prefixed(signer), None)
                if signed_data is None:
                    continue
                parts = list(_length_prefixed(signed_data))
                if len(parts) < 2:
                    continue
                # parts[0] is digests, parts[1] is the certificate chain.
                for cert in _length_prefixed(parts[1]):
                    digest = hashlib.sha256(cert).hexdigest().upper()
                    found[scheme] = ":".join(
                        digest[i : i + 2] for i in range(0, len(digest), 2)
                    )
                    break
                break
            break
    if not found:
        raise ValueError("nenhum certificado v2/v3 encontrado")
    return found


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    try:
        found = fingerprints(sys.argv[1])
    except ValueError as err:
        print(f"erro: {err}", file=sys.stderr)
        return 1
    # v3 supersedes v2 when both are present; either is the same key here.
    print(found.get("v3") or found["v2"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
