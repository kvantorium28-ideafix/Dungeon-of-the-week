import subprocess

from bot.max_api import extra_certs, ssl_context


def test_extra_certs_pem_and_der(tmp_path):
    pem = tmp_path / "root.pem"
    subprocess.run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", str(tmp_path / "k"),
                    "-out", str(pem), "-days", "1", "-subj", "/CN=Test Root"], check=True, capture_output=True)
    subprocess.run(["openssl", "x509", "-in", str(pem), "-outform", "der", "-out", str(tmp_path / "sub.cer")],
                   check=True, capture_output=True)
    (tmp_path / "k").unlink()
    (tmp_path / "README.txt").write_text("не сертификат")
    assert extra_certs(str(tmp_path)) == ["root.pem", "sub.cer"]
    names = [str(c["subject"]) for c in ssl_context(str(tmp_path)).get_ca_certs()]
    assert sum("Test Root" in n for n in names) == 1
