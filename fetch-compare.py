import cloudscraper
import json


# cloudflare 自带 antibot， 可以使用 cloudscraper 绕过 https://pypi.org/project/cloudscraper/
data_source = "https://kusama.webapi.subscan.io/api/scan/parachain/contributes"
# 后端有最大数据限制，100是个比价保险的边界
PAGE_SIZE = 100


# fund_id 可以在 subscan 上找到
def fetch_contribution_list(fund_id, page=0):
    # Example result
    """
    {
      "code": 0,
      "message": "Success",
      "generated_at": 1654099939,
      "data": {
        "contributes": [
          {
            "fund_id": "2115-74",
            "para_id": 2115,
            "who": "GtWD1XXJGsG1X3b3t7FSt23fpqCfKn3zKCUZDKGYpWBb7dT",
            "contributed": "500000000000",
            "contributing": "500000000000",
            "block_num": 12382623,
            "block_timestamp": 1650739212,
            "extrinsic_index": "12382623-3",
            "event_index": "12382623-33",
            "status": 1,
            "memo": "",
            "who_display": {
              "address": "GtWD1XXJGsG1X3b3t7FSt23fpqCfKn3zKCUZDKGYpWBb7dT",
              "display": "",
              "judgements": null,
              "account_index": "",
              "identity": false,
              "parent": null
            }
          }
        ],
        "count": 361
      }
    }
    """
    scraper = cloudscraper.create_scraper()
    res = scraper.post(
        data_source,
        json={
            "row": PAGE_SIZE,
            "page": page,
            "fund_id": fund_id,
            "order": ""}
    )
    if res.status_code != 200:
        print(f"Response not ok, with code:{res.status_code}")
        print(res.text)
        return
    return res.json()


if __name__ == '__main__':
    data = []
    first = fetch_contribution_list("2115-74")
    if not first:
        print("首页数据获取失败")
        exit(0)
    data = first['data']['contributes']
    rounds = (first['data']['count'] + PAGE_SIZE - 1) // PAGE_SIZE
    for i in range(1, rounds):
        print(f"Fetching page: {i+1}")
        result = fetch_contribution_list("2115-74", i)
        if not result or result['data']['contributes'] is None:
            print("Fetch failed, move on...")
            continue
        data += result['data']['contributes']

    formatted = {}
    for d in data:
        formatted[d['extrinsic_index']+'/' + d['who']] = d['contributed']

    print("start analysis...")
    downloaded = json.load(open("contributorlist.json"))
    for d in downloaded['contributions']:
        key = d['tex_id'] + '/' + d['account']
        if formatted[key] == d['contribution']:
            del formatted[key]
        else:
            print(f"No match in list: {d}")
    print(f"left data: {formatted}")
